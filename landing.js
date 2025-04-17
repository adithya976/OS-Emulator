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