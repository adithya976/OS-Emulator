function navigateTo(folderName,filename) {
    window.location.href = `${folderName}/${filename}.html`;
  }
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        window.scrollTo({
            top: targetElement.offsetTop - 150, // Offset for header height
            behavior: 'smooth'
        });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const headers = document.querySelectorAll('.concept-header');
    
    headers.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle active class on the header
            this.classList.toggle('active');
            
            // Toggle the content visibility
            const content = this.nextElementSibling;
            content.classList.toggle('active');
            
            // Close other open items
            headers.forEach(otherHeader => {
                if (otherHeader !== this && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.classList.remove('active');
                }
            });
        });
    });
});