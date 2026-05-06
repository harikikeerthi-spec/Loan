const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (filePath.endsWith('.controller.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const controllerFiles = getAllFiles(srcDir);
const endpoints = [];

for (const file of controllerFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let currentController = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const controllerMatch = line.match(/@Controller\(['"]([^'"]*)['"]\)/);
        if (controllerMatch) {
            currentController = '/' + controllerMatch[1];
            if (currentController.endsWith('/')) {
                currentController = currentController.slice(0, -1);
            }
            continue;
        }

        const emptyControllerMatch = line.match(/@Controller\(\)/);
        if (emptyControllerMatch) {
            currentController = '';
            continue;
        }

        const methodMatch = line.match(/@(Get|Post|Patch|Put|Delete)\((.*)\)/);
        if (methodMatch) {
            const method = methodMatch[1].toUpperCase();
            let routePath = '';
            if (methodMatch[2]) {
                // extract string if exists
                const pathMatch = methodMatch[2].match(/['"]([^'"]*)['"]/);
                if (pathMatch) {
                    routePath = pathMatch[1];
                }
            }
            if (routePath && !routePath.startsWith('/')) {
                routePath = '/' + routePath;
            }

            let fullPath = `${currentController}${routePath || ''}`.replace(/\/\//g, '/');
            endpoints.push(`${method.padEnd(6)} ${fullPath}`);
        }
    }
}

fs.writeFileSync(path.join(__dirname, 'routes.txt'), endpoints.join('\n'));
console.log('Routes written to routes.txt');
