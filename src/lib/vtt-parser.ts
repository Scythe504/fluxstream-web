interface ParsedCue {
  startTime: number;
  endTime: number;
  text: string;
}


// Clean VTT subtitles cues to standard safe HTML
function parseVttToHtml(vttText: string): string {
  let html = vttText
  
  // Replace line breaks with <br>
  html = html.replace(/\r?\n/g, '<br>')
  
  // Clean up timestamp tags if any (e.g. <00:00:01.000>)
  // Replace with a space so adjacent words don't get glued together
  html = html.replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, ' ')
  html = html.replace(/<\d{2}:\d{2}\.\d{3}>/g, ' ')
  
  // Replace <i> and </i> tags
  html = html.replace(/<i[^>]*>/gi, 'italic-start-placeholder')
  html = html.replace(/<\/i>/gi, 'italic-end-placeholder')
  
  // Replace <b> and </b> tags
  html = html.replace(/<b[^>]*>/gi, 'bold-start-placeholder')
  html = html.replace(/<\/b>/gi, 'bold-end-placeholder')
  
  // Replace <u> and </u> tags
  html = html.replace(/<u[^>]*>/gi, 'underline-start-placeholder')
  html = html.replace(/<\/u>/gi, 'underline-end-placeholder')
  
  // Strip ASS override blocks like {\an8}, {\pos(100,100)}, etc. - replace with a space
  html = html.replace(/{[^}]+}/g, ' ')
  
  // Strip all other HTML tags (to prevent any XSS or broken tags) - replace with a space
  html = html.replace(/<[^>]+>/g, ' ')
  
  // Collapse multiple spaces into a single space
  html = html.replace(/\s+/g, ' ')
  
  // Trim
  html = html.trim()

  // Replace standard spaces with non-breaking spaces so browser never collapses them
  html = html.replace(/ /g, '&nbsp;')
  
  // Restore our safe tags (maintaining their standard class spaces safely)
  html = html.replace(/italic-start-placeholder/g, '<em class="italic">')
  html = html.replace(/italic-end-placeholder/g, '</em>')
  html = html.replace(/bold-start-placeholder/g, '<strong class="font-bold">')
  html = html.replace(/bold-end-placeholder/g, '</strong>')
  html = html.replace(/underline-start-placeholder/g, '<u class="underline">')
  html = html.replace(/underline-end-placeholder/g, '</u>')
  
  return html
}

function parseVttTimestamp(timestamp: string): number {
  try {
    const parts = timestamp.trim().split(":")
    let hours = 0
    let minutes = 0
    let secondsWithMs = 0

    if (parts.length === 3) {
      hours = parseInt(parts[0], 10) || 0
      minutes = parseInt(parts[1], 10) || 0
      secondsWithMs = parseFloat(parts[2]) || 0
    } else if (parts.length === 2) {
      minutes = parseInt(parts[0], 10) || 0
      secondsWithMs = parseFloat(parts[1]) || 0
    } else {
      secondsWithMs = parseFloat(parts[0]) || 0
    }

    return hours * 3600 + minutes * 60 + secondsWithMs
  } catch (err) {
    console.error("Error parsing timestamp:", timestamp, err)
    return 0
  }
}

function parseVttText(vttString: string): ParsedCue[] {
  const lines = vttString.split(/\r?\n/)
  const cues: ParsedCue[] = []
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    
    // Check if this line is a timestamp line (contains -->)
    if (line.includes("-->")) {
      const parts = line.split("-->")
      if (parts.length === 2) {
        // Extract timestamps, ignoring any settings after space
        const startPart = parts[0].trim().split(/\s+/)[0]
        const endPart = parts[1].trim().split(/\s+/)[0]
        
        const startTime = parseVttTimestamp(startPart)
        const endTime = parseVttTimestamp(endPart)
        
        // Read cue text lines until we hit an empty line or end of file
        let text = ""
        i++
        while (i < lines.length && lines[i].trim() !== "") {
          if (text) {
            text += "\n"
          }
          text += lines[i]
          i++
        }
        
        cues.push({ startTime, endTime, text })
      }
    }
    i++
  }
  
  return cues
}


export { parseVttText, parseVttTimestamp, parseVttToHtml, type ParsedCue }