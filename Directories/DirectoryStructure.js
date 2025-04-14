document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const structureTypeSelect = document.getElementById('structure-type');
    const numFilesInput = document.getElementById('num-files');
    const numDirsInput = document.getElementById('num-dirs');
    const numDirsGroup = document.getElementById('num-dirs-group');
    const runSimulationBtn = document.getElementById('run-simulation');
    const resetSimulationBtn = document.getElementById('reset-simulation');
    const structureContainer = document.getElementById('structure-container');
    const operationInfo = document.getElementById('operation-info');
    const filePathInput = document.getElementById('file-path');
    const findFileBtn = document.getElementById('find-file');
    const createFileBtn = document.getElementById('create-file');
    const deleteFileBtn = document.getElementById('delete-file');

// Add new buttons for directory operations
const operationControls = document.getElementById('operation-controls');

// Create a container for directory buttons
const dirButtonGroup = document.createElement('div');
dirButtonGroup.style.marginTop = '10px';

// Create directory button
const createDirBtn = document.createElement('button');
createDirBtn.id = 'create-directory';
createDirBtn.textContent = 'Create Directory';
dirButtonGroup.appendChild(createDirBtn);

// Delete directory button
const deleteDirBtn = document.createElement('button');
deleteDirBtn.id = 'delete-directory';
deleteDirBtn.textContent = 'Delete Directory';
dirButtonGroup.appendChild(deleteDirBtn);

// Add the button group after existing controls
operationControls.appendChild(dirButtonGroup);

    // Global state variables
    let currentStructure = null;
    let currentType = 'single';
    let currentPath = '/';
    let fileCounter = 1;
    let dirCounter = 1;

    // Event Listeners
    structureTypeSelect.addEventListener('change', function() {
        currentType = this.value;
        numDirsGroup.style.display = this.value === 'tree' ? 'flex' : 'none';
        // Show or hide directory operation buttons based on structure type
        createDirBtn.style.display = this.value === 'tree' ? 'inline-block' : 'none';
        deleteDirBtn.style.display = this.value === 'tree' ? 'inline-block' : 'none';
        resetSimulation();
    });

    runSimulationBtn.addEventListener('click', runSimulation);
    resetSimulationBtn.addEventListener('click', resetSimulation);
    findFileBtn.addEventListener('click', findFile);
    createFileBtn.addEventListener('click', createFile);
    deleteFileBtn.addEventListener('click', deleteFile);
    createDirBtn.addEventListener('click', createDirectory);
    deleteDirBtn.addEventListener('click', deleteDirectory);

    // Initially hide directory buttons for single-level structure
    createDirBtn.style.display = 'none';
    deleteDirBtn.style.display = 'none';

    // Add event delegation for directory navigation
    structureContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('directory-name')) {
            const dirPath = e.target.getAttribute('data-path');
            navigateDirectory(dirPath);
        }
    });

    // Core functions
    function runSimulation() {
        const numFiles = parseInt(numFilesInput.value);
        const numDirs = currentType === 'tree' ? parseInt(numDirsInput.value) : 0;
        
        if (numFiles < 1 || numFiles > 20) {
            alert('Number of files must be between 1 and 20');
            return;
        }
        
        if (currentType === 'tree' && (numDirs < 1 || numDirs > 5)) {
            alert('Number of directories must be between 1 and 5');
            return;
        }
        
        currentStructure = createDirectoryStructure(currentType, numFiles, numDirs);
        currentPath = '/';
        renderDirectoryStructure();
        updateOperationInfo(`New ${currentType === 'single' ? 'single-level' : 'tree-structured'} directory created.`);
    }

    function createDirectoryStructure(type, numFiles, numDirs) {
        // Create root directory
        const root = {
            name: 'root',
            type: 'directory',
            path: '/',
            children: []
        };
        
        if (type === 'single') {
            // For single-level directory, add files directly to root
            for (let i = 1; i <= numFiles; i++) {
                root.children.push({
                    name: `file${i}.txt`,
                    type: 'file',
                    path: `/file${i}.txt`
                });
            }
        } else {
            // For tree structure, create subdirectories and files
            for (let i = 1; i <= numDirs; i++) {
                const dir = {
                    name: `dir${i}`,
                    type: 'directory',
                    path: `/dir${i}/`,
                    children: []
                };
                
                // Add files to each directory
                const filesPerDir = Math.ceil(numFiles / numDirs);
                for (let j = 1; j <= filesPerDir; j++) {
                    if ((i-1) * filesPerDir + j <= numFiles) {
                        dir.children.push({
                            name: `file${(i-1) * filesPerDir + j}.txt`,
                            type: 'file',
                            path: `/dir${i}/file${(i-1) * filesPerDir + j}.txt`
                        });
                    }
                }
                
                root.children.push(dir);
            }
        }
        
        return root;
    }

    function resetSimulation() {
        currentStructure = null;
        currentPath = '/';
        structureContainer.innerHTML = '';
        operationInfo.innerHTML = '';
        filePathInput.value = '';
        fileCounter = 1;
        dirCounter = 1;
    }

    function createFile() {
        if (!currentStructure) {
            alert('Please run a simulation first');
            return;
        }
        
        const path = filePathInput.value.trim();
        if (!path) {
            alert('Please enter a file path');
            return;
        }

        if (currentType === 'single') {
            handleSingleLevelCreate(path);
        } else {
            handleTreeCreate(path);
        }
        renderDirectoryStructure();
    }

    function deleteFile() {
        if (!currentStructure) {
            alert('Please run a simulation first');
            return;
        }
        
        const path = filePathInput.value.trim();
        if (!path) {
            alert('Please enter a file path');
            return;
        }

        const result = currentType === 'single' 
            ? deleteFromSingleLevel(path) 
            : deleteFromTree(path, 'file');
        
        if (result) {
            renderDirectoryStructure();
            updateOperationInfo(`Deleted file: ${path}`);
        } else {
            updateOperationInfo(`File not found: ${path}`);
        }
    }

    function findFile() {
        if (!currentStructure) {
            alert('Please run a simulation first');
            return;
        }
        
        const path = filePathInput.value.trim();
        if (!path) {
            alert('Please enter a file path');
            return;
        }

        const exists = currentType === 'single' 
            ? findInSingleLevel(path) 
            : findInTree(path, 'file');
        
        updateOperationInfo(exists ? `File found: ${path}` : `File not found: ${path}`);
    }

    // New function to create directory
    function createDirectory() {
        if (!currentStructure) {
            alert('Please run a simulation first');
            return;
        }
        
        if (currentType !== 'tree') {
            alert('Directory creation is only available in tree structure');
            return;
        }
        
        const path = filePathInput.value.trim();
        if (!path) {
            alert('Please enter a directory path');
            return;
        }
        
        // Call function to create directory
        handleTreeCreateDirectory(path);
        renderDirectoryStructure();
    }

    // New function to delete directory
    function deleteDirectory() {
        if (!currentStructure) {
            alert('Please run a simulation first');
            return;
        }
        
        if (currentType !== 'tree') {
            alert('Directory deletion is only available in tree structure');
            return;
        }
        
        const path = filePathInput.value.trim();
        if (!path) {
            alert('Please enter a directory path');
            return;
        }
        
        // Prevent deleting root directory
        if (path === '/' || path === '') {
            alert('Cannot delete root directory');
            return;
        }
        
        // Call function to delete directory
        const result = deleteFromTree(path, 'directory');
        if (result) {
            // If we deleted the current directory, navigate up
            if (currentPath.startsWith(path)) {
                // Navigate to parent directory
                const parentPath = getParentPath(path);
                currentPath = parentPath;
            }
            renderDirectoryStructure();
            updateOperationInfo(`Deleted directory: ${path}`);
        } else {
            updateOperationInfo(`Directory not found: ${path}`);
        }
    }

    // Helper to get parent path
    function getParentPath(path) {
        // Ensure path has trailing slash for directories
        if (!path.endsWith('/')) {
            path += '/';
        }
        
        // Remove trailing slash
        path = path.slice(0, -1);
        
        // Find last slash
        const lastSlashIndex = path.lastIndexOf('/');
        if (lastSlashIndex <= 0) {
            return '/';
        }
        
        return path.slice(0, lastSlashIndex + 1);
    }

    // Directory structure helpers
    function handleSingleLevelCreate(path) {
        // For single-level, we just need the filename (ignore directories)
        let fileName = path;
        
        // Remove any leading slash and path components
        if (fileName.includes('/')) {
            const parts = fileName.split('/').filter(p => p);
            fileName = parts[parts.length - 1];
        }
        
        if (currentStructure.children.some(f => f.name === fileName)) {
            updateOperationInfo(`File already exists: ${fileName}`);
            return;
        }
        
        currentStructure.children.push({
            name: fileName,
            type: 'file',
            path: `/${fileName}`
        });
        updateOperationInfo(`Created file: /${fileName}`);
    }

    function handleTreeCreate(fullPath) {
        // Normalize path to always start with slash
        if (!fullPath.startsWith('/')) {
            fullPath = '/' + fullPath;
        }
        
        const pathParts = fullPath.split('/').filter(p => p);
        
        if (pathParts.length === 0) {
            updateOperationInfo('Invalid path: missing filename');
            return;
        }
        
        let currentDir = currentStructure;
        
        // Navigate or create directories
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            let dir = currentDir.children.find(c => c.name === part && c.type === 'directory');
            
            if (!dir) {
                // Create the directory if it doesn't exist
                dir = {
                    name: part,
                    type: 'directory',
                    path: currentDir.path + part + '/',
                    children: []
                };
                currentDir.children.push(dir);
                updateOperationInfo(`Created directory: ${dir.path}`);
            }
            currentDir = dir;
        }
        
        // Create file
        const fileName = pathParts[pathParts.length - 1];
        if (currentDir.children.some(f => f.name === fileName)) {
            updateOperationInfo(`File already exists: ${currentDir.path}${fileName}`);
            return;
        }
        
        currentDir.children.push({
            name: fileName,
            type: 'file',
            path: `${currentDir.path}${fileName}`
        });
        updateOperationInfo(`Created file: ${currentDir.path}${fileName}`);
    }

    // New function to create directory in tree structure
    function handleTreeCreateDirectory(fullPath) {
        // Normalize path to always start with slash
        if (!fullPath.startsWith('/')) {
            fullPath = '/' + fullPath;
        }
        
        // Ensure path ends with slash for directories
        if (!fullPath.endsWith('/')) {
            fullPath += '/';
        }
        
        const pathParts = fullPath.split('/').filter(p => p);
        
        if (pathParts.length === 0) {
            updateOperationInfo('Invalid path: missing directory name');
            return;
        }
        
        let currentDir = currentStructure;
        
        // Navigate or create parent directories
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            let dir = currentDir.children.find(c => c.name === part && c.type === 'directory');
            
            if (!dir) {
                // Create the directory if it doesn't exist
                dir = {
                    name: part,
                    type: 'directory',
                    path: currentDir.path + part + '/',
                    children: []
                };
                currentDir.children.push(dir);
                updateOperationInfo(`Created directory: ${dir.path}`);
            }
            currentDir = dir;
        }
        
        // Create the final directory
        const dirName = pathParts[pathParts.length - 1];
        if (currentDir.children.some(d => d.name === dirName && d.type === 'directory')) {
            updateOperationInfo(`Directory already exists: ${currentDir.path}${dirName}/`);
            return;
        }
        
        currentDir.children.push({
            name: dirName,
            type: 'directory',
            path: `${currentDir.path}${dirName}/`,
            children: []
        });
        updateOperationInfo(`Created directory: ${currentDir.path}${dirName}/`);
    }

    function deleteFromSingleLevel(path) {
        let fileName = path;
        
        // Remove any leading slash and path components
        if (fileName.includes('/')) {
            const parts = fileName.split('/').filter(p => p);
            fileName = parts[parts.length - 1];
        }
        
        const index = currentStructure.children.findIndex(c => c.name === fileName);
        if (index === -1) return false;
        
        currentStructure.children.splice(index, 1);
        return true;
    }

    function findInSingleLevel(path) {
        let fileName = path;
        
        // Remove any leading slash and path components
        if (fileName.includes('/')) {
            const parts = fileName.split('/').filter(p => p);
            fileName = parts[parts.length - 1];
        }
        
        return currentStructure.children.some(c => c.name === fileName);
    }

    // Enhanced function to delete both files and directories
    function deleteFromTree(fullPath, itemType = 'file') {
        // Normalize path to always start with slash
        if (!fullPath.startsWith('/')) {
            fullPath = '/' + fullPath;
        }
        
        // For directories, ensure path ends with slash
        if (itemType === 'directory' && !fullPath.endsWith('/')) {
            fullPath += '/';
        }
        
        const pathParts = fullPath.split('/').filter(p => p);
        
        if (pathParts.length === 0) {
            return false;
        }
        
        let currentDir = currentStructure;
        
        // Navigate to the parent directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = currentDir.children.find(c => c.name === pathParts[i] && c.type === 'directory');
            if (!currentDir) return false;
        }
        
        // Find and delete the item
        const itemName = pathParts[pathParts.length - 1];
        const index = currentDir.children.findIndex(c => c.name === itemName && c.type === itemType);
        if (index === -1) return false;
        
        currentDir.children.splice(index, 1);
        return true;
    }

    // Enhanced function to find both files and directories
    function findInTree(fullPath, itemType = 'file') {
        // Normalize path to always start with slash
        if (!fullPath.startsWith('/')) {
            fullPath = '/' + fullPath;
        }
        
        // For directories, ensure path ends with slash
        if (itemType === 'directory' && !fullPath.endsWith('/')) {
            fullPath += '/';
        }
        
        const pathParts = fullPath.split('/').filter(p => p);
        
        if (pathParts.length === 0) {
            return false;
        }
        
        let currentDir = currentStructure;
        
        // Navigate to the parent directory
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentDir = currentDir.children.find(c => c.name === pathParts[i] && c.type === 'directory');
            if (!currentDir) return false;
        }
        
        // Find the item
        return currentDir.children.some(c => c.name === pathParts[pathParts.length - 1] && c.type === itemType);
    }

    // Navigation functions
    function navigateDirectory(path) {
        currentPath = path;
        updateOperationInfo(`Navigated to: ${path}`);
        filePathInput.value = path;
        renderCurrentDirectory();
    }

    // Rendering functions
    function renderDirectoryStructure() {
        if (!currentStructure) {
            structureContainer.innerHTML = '<p>No structure to display. Please run simulation first.</p>';
            return;
        }
        
        structureContainer.innerHTML = '';
        if (currentType === 'single') {
            renderSingleLevel();
        } else {
            renderCurrentDirectory();
        }
    }

    function renderSingleLevel() {
        // For single-level, show all files directly
        const title = document.createElement('h4');
        title.textContent = 'Root Directory (/)';
        structureContainer.appendChild(title);
        
        const filesList = document.createElement('div');
        filesList.classList.add('directory');
        
        currentStructure.children.forEach(item => {
            const elem = document.createElement('div');
            elem.classList.add('file-item');
            elem.textContent = item.name;
            filesList.appendChild(elem);
        });
        
        structureContainer.appendChild(filesList);
    }

    function renderCurrentDirectory() {
        // Find the directory object for the current path
        let currentDir = findDirectoryByPath(currentPath);
        if (!currentDir) {
            structureContainer.innerHTML = '<p>Directory not found</p>';
            return;
        }
        
        // Render navigation breadcrumbs
        const breadcrumbs = document.createElement('div');
        breadcrumbs.classList.add('breadcrumbs');
        
        // Split the path into parts
        const pathParts = currentPath.split('/').filter(p => p);
        let cumulativePath = '/';
        
        // Add root link
        const rootLink = document.createElement('span');
        rootLink.textContent = 'root';
        rootLink.classList.add('nav-dir');
        rootLink.setAttribute('data-path', '/');
        rootLink.addEventListener('click', () => navigateDirectory('/'));
        breadcrumbs.appendChild(rootLink);
        
        // Add separator
        if (pathParts.length > 0) {
            breadcrumbs.appendChild(document.createTextNode(' / '));
        }
        
        // Add path parts as links
        for (let i = 0; i < pathParts.length; i++) {
            cumulativePath += pathParts[i] + '/';
            
            const link = document.createElement('span');
            link.textContent = pathParts[i];
            link.classList.add('nav-dir');
            link.setAttribute('data-path', cumulativePath);
            link.addEventListener('click', () => navigateDirectory(cumulativePath));
            breadcrumbs.appendChild(link);
            
            if (i < pathParts.length - 1) {
                breadcrumbs.appendChild(document.createTextNode(' / '));
            }
        }
        
        structureContainer.appendChild(breadcrumbs);
        
        // Add title for current directory
        const title = document.createElement('h4');
        title.textContent = `Contents of ${currentPath}`;
        structureContainer.appendChild(title);
        
        // Render directories first
        const container = document.createElement('div');
        container.classList.add('directory');
        
        const directories = currentDir.children.filter(child => child.type === 'directory');
        directories.forEach(dir => {
            const dirElem = document.createElement('div');
            dirElem.classList.add('directory-name');
            dirElem.textContent = dir.name;
            dirElem.setAttribute('data-path', dir.path);
            container.appendChild(dirElem);
        });
        
        // Then render files
        const files = currentDir.children.filter(child => child.type === 'file');
        files.forEach(file => {
            const fileElem = document.createElement('div');
            fileElem.classList.add('file-item');
            fileElem.textContent = file.name;
            container.appendChild(fileElem);
        });
        
        structureContainer.appendChild(container);
    }

    function findDirectoryByPath(path) {
        if (path === '/' || path === '') {
            return currentStructure;
        }
        
        // Remove trailing slash if present
        if (path.endsWith('/') && path.length > 1) {
            path = path.slice(0, -1);
        }
        
        const pathParts = path.split('/').filter(p => p);
        let currentDir = currentStructure;
        
        for (const part of pathParts) {
            const nextDir = currentDir.children.find(c => c.name === part && c.type === 'directory');
            if (!nextDir) return null;
            currentDir = nextDir;
        }
        
        return currentDir;
    }

    function updateOperationInfo(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        
        // Add new messages at the top
        operationInfo.insertBefore(logEntry, operationInfo.firstChild);
        
        // Limit to 10 messages
        while (operationInfo.children.length > 10) {
            operationInfo.removeChild(operationInfo.lastChild);
        }
    }
});