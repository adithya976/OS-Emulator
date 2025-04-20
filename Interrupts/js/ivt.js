// Initialize the Interrupt Vector Table display
export function initIVT() {
    const ivtTable = document.getElementById('ivt-table');
    
    // Define the IVT entries 
    const ivtEntries = [
      { type: 'Keyboard', address: '0x0021', description: 'Keyboard input handler' },
      { type: 'Timer', address: '0x0008', description: 'System timer handler' },
      { type: 'I/O', address: '0x00E0', description: 'I/O completion handler' },
      { type: 'Software', address: '0x0080', description: 'System call handler' },
      { type: 'Hardware', address: '0x00F0', description: 'Hardware error handler' }
    ];
    
    // Populate the IVT table
    ivtEntries.forEach(entry => {
      const typeElement = document.createElement('div');
      typeElement.className = 'ivt-type';
      typeElement.textContent = entry.type;
      typeElement.title = entry.description;
      
      const addressElement = document.createElement('div');
      addressElement.className = 'ivt-address';
      addressElement.textContent = entry.address;
      addressElement.title = entry.description;
      
      // Create a container for each entry (using CSS grid display:contents)
      const entryContainer = document.createElement('div');
      entryContainer.className = 'ivt-entry';
      entryContainer.dataset.type = entry.type.toLowerCase();
      
      // Add elements to the container
      entryContainer.appendChild(typeElement);
      entryContainer.appendChild(addressElement);
      
      // Add the entry to the IVT table
      ivtTable.appendChild(entryContainer);
    });
  }
  
  // Highlight the selected interrupt in the IVT
  export function highlightIVTEntry(interruptType) {
    // Reset all entries
    const entries = document.querySelectorAll('.ivt-entry');
    entries.forEach(entry => entry.classList.remove('active'));
    
    // Find and highlight the matching entry
    const selectedEntry = document.querySelector(`.ivt-entry[data-type="${interruptType}"]`);
    if (selectedEntry) {
      selectedEntry.classList.add('active');
    }
  }
  
  // Get the ISR address for a specific interrupt type
  export function getISRAddress(interruptType) {
    const entry = document.querySelector(`.ivt-entry[data-type="${interruptType}"]`);
    if (entry) {
      const addressElement = entry.querySelector('.ivt-address');
      return addressElement.textContent;
    }
    return null;
  }