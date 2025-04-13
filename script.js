document.getElementById('startBtn').addEventListener('click', function() {
    window.location.href = 'landing.html'; 
});

// Add subtle animation to the background shapes
document.addEventListener('mousemove', function(e) {
    const shapes = document.querySelectorAll('.shape');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    shapes.forEach((shape, index) => {
        const factor = (index + 1) * 0.01;
        const offsetX = (x - 0.5) * factor * 50;
        const offsetY = (y - 0.5) * factor * 50;
        
        shape.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
});