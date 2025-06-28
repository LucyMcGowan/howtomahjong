// MahjongUtils.js - Common utility functions for Mahjong games

class MahjongUtils {
    /**
     * Creates a mahjong tile element with standard properties
     * @param {string} tileId - Unique identifier for the tile
     * @param {number} wallIndex - Wall index (optional)
     * @param {boolean} draggable - Whether the tile should be draggable
     * @param {string} additionalClasses - Additional CSS classes to add
     * @returns {HTMLElement} The created tile element
     */
    static createTile(tileId, wallIndex = null, draggable = false, additionalClasses = '') {
        const tile = document.createElement('div');
        tile.className = `mahjong-tile ${additionalClasses}`.trim();
        tile.draggable = draggable;
        tile.dataset.tileId = tileId;
        
        if (wallIndex !== null) {
            tile.dataset.wallIndex = wallIndex;
        }
        
        return tile;
    }

    /**
     * Positions a tile within a wall based on wall orientation and stack configuration
     * @param {HTMLElement} tile - The tile element to position
     * @param {number} wallIndex - Wall index (0=left, 1=top, 2=right, 3=bottom)
     * @param {number} tileIndex - Index of the tile within the wall
     * @param {number} tilesPerStack - Number of tiles per stack (default 2)
     */
    static positionTileInWall(tile, wallIndex, tileIndex, tilesPerStack = 2) {
        const stackIndex = Math.floor(tileIndex / tilesPerStack);
        const isTopTile = tileIndex % tilesPerStack === 1;

        // Apply rotation for vertical walls
        if (wallIndex === 0 || wallIndex === 2) {
            tile.style.transform = 'rotate(90deg)';
        }

        // Position based on wall orientation
        if (wallIndex === 1 || wallIndex === 3) {
            // Top and bottom walls - horizontal layout
            tile.style.left = (10 + stackIndex * 30) + 'px';
            tile.style.top = (isTopTile ? 15 : 35) + 'px';
        } else {
            // Left and right walls - vertical layout
            tile.style.top = (20 + stackIndex * 25) + 'px';
            tile.style.left = (isTopTile ? 25 : 45) + 'px';
        }

        if (isTopTile) {
            tile.classList.add('stacked');
        }
    }

    /**
     * Creates a complete wall of tiles
     * @param {string} wallId - ID of the wall container element
     * @param {number} wallIndex - Wall index for positioning
     * @param {number} totalTiles - Total number of tiles in the wall
     * @param {boolean} placed - Whether tiles should be marked as placed
     * @returns {Array} Array of created tile elements
     */
    static createWall(wallId, wallIndex, totalTiles, placed = false) {
        const wallEl = document.getElementById(wallId);
        wallEl.innerHTML = '';
        const tiles = [];

        for (let i = 0; i < totalTiles; i++) {
            const tileId = `${wallIndex}-${i}`;
            const additionalClasses = placed ? 'fixed' : '';
            const tile = this.createTile(tileId, wallIndex, !placed, additionalClasses);
            
            this.positionTileInWall(tile, wallIndex, i);
            
            wallEl.appendChild(tile);
            tiles.push(tile);
        }

        return tiles;
    }

    /**
     * Shows a hint message to the user
     * @param {string} message - The hint message to display
     * @param {number} duration - How long to show the hint (milliseconds)
     */
    static showHint(message, duration = 4000) {
        const existingHint = document.getElementById('hintDisplay');
        if (existingHint) existingHint.remove();

        const hintDiv = document.createElement('div');
        hintDiv.id = 'hintDisplay';
        hintDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 1.1em;
            z-index: 3000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            border: 2px solid #ffd700;
        `;
        hintDiv.textContent = message;
        document.body.appendChild(hintDiv);

        setTimeout(() => {
            if (hintDiv) hintDiv.remove();
        }, duration);
    }

    /**
     * Sets up standard drag and drop event listeners
     * @param {Object} handlers - Object containing handler functions
     * @param {Function} handlers.dragStart - Drag start handler
     * @param {Function} handlers.dragOver - Drag over handler
     * @param {Function} handlers.dragLeave - Drag leave handler (optional)
     * @param {Function} handlers.drop - Drop handler
     * @param {Function} handlers.dragEnd - Drag end handler (optional)
     */
    static setupDragAndDrop(handlers) {
        if (handlers.dragStart) {
            document.addEventListener('dragstart', handlers.dragStart);
        }
        if (handlers.dragOver) {
            document.addEventListener('dragover', handlers.dragOver);
        }
        if (handlers.dragLeave) {
            document.addEventListener('dragleave', handlers.dragLeave);
        }
        if (handlers.drop) {
            document.addEventListener('drop', handlers.drop);
        }
        if (handlers.dragEnd) {
            document.addEventListener('dragend', handlers.dragEnd);
        }
    }

    /**
     * Removes drag and drop event listeners
     * @param {Object} handlers - Object containing handler functions to remove
     */
    static removeDragAndDrop(handlers) {
        if (handlers.dragStart) {
            document.removeEventListener('dragstart', handlers.dragStart);
        }
        if (handlers.dragOver) {
            document.removeEventListener('dragover', handlers.dragOver);
        }
        if (handlers.dragLeave) {
            document.removeEventListener('dragleave', handlers.dragLeave);
        }
        if (handlers.drop) {
            document.removeEventListener('drop', handlers.drop);
        }
        if (handlers.dragEnd) {
            document.removeEventListener('dragend', handlers.dragEnd);
        }
    }

    /**
     * Updates a stats display element
     * @param {string} elementId - ID of the element to update
     * @param {string|number} value - Value to display
     */
    static updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Updates multiple stats at once
     * @param {Object} stats - Object with elementId: value pairs
     */
    static updateStats(stats) {
        Object.entries(stats).forEach(([elementId, value]) => {
            this.updateStat(elementId, value);
        });
    }

    /**
     * Shows a completion message
     * @param {string} elementId - ID of the completion message element
     * @param {number} delay - Delay before showing the message (milliseconds)
     */
    static showCompletion(elementId, delay = 500) {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.display = 'block';
            }
        }, delay);
    }

    /**
     * Adds or removes CSS classes from player areas to highlight current player
     * @param {string} className - Class name to add/remove
     * @param {string} currentPlayerId - ID of the current player element
     * @param {Array} allPlayerIds - Array of all player element IDs
     */
    static highlightCurrentPlayer(className, currentPlayerId, allPlayerIds) {
        // Remove class from all players
        allPlayerIds.forEach(playerId => {
            const element = document.getElementById(playerId);
            if (element) {
                element.classList.remove(className);
            }
        });

        // Add class to current player
        const currentElement = document.getElementById(currentPlayerId);
        if (currentElement) {
            currentElement.classList.add(className);
        }
    }

    /**
     * Creates a tile cluster for display in player areas
     * @param {number} tileCount - Number of tiles in the cluster
     * @param {boolean} isDealer - Whether this is for the dealer (special styling)
     * @param {boolean} isFinal - Whether this is the final deal phase
     * @returns {HTMLElement} The created cluster element
     */
    static createTileCluster(tileCount, isDealer = false, isFinal = false) {
        const cluster = document.createElement('div');
        cluster.className = 'tile-cluster';

        if (tileCount === 4) {
            // Normal case: 2 stacks of 2
            for (let stack = 0; stack < 2; stack++) {
                for (let i = 0; i < 2; i++) {
                    const tile = document.createElement('div');
                    tile.className = 'mahjong-tile placed';
                    tile.style.position = 'absolute';
                    tile.style.left = (stack * 22) + 'px';
                    tile.style.top = (i * 2) + 'px';
                    cluster.appendChild(tile);
                }
            }
        } else if (tileCount === 2) {
            // Special case: 1 stack of 2 or dealer's final 2 tiles
            for (let i = 0; i < 2; i++) {
                const tile = document.createElement('div');
                tile.className = 'mahjong-tile placed';
                if (isFinal && isDealer) {
                    tile.style.border = '2px solid gold';
                }
                tile.style.position = 'absolute';
                tile.style.left = (i * 11) + 'px';
                tile.style.top = '0px';
                cluster.appendChild(tile);
            }
        } else if (tileCount === 1) {
            // Special case: 1 tile
            const tile = document.createElement('div');
            tile.className = 'mahjong-tile placed';
            tile.style.position = 'absolute';
            tile.style.left = '0px';
            tile.style.top = '0px';
            cluster.appendChild(tile);
        }

        return cluster;
    }

    /**
     * Generates random position for scattered tiles
     * @param {number} maxWidth - Maximum width for positioning
     * @param {number} maxHeight - Maximum height for positioning
     * @returns {Object} Object with x and y coordinates
     */
    static getRandomPosition(maxWidth, maxHeight) {
        return {
            x: Math.random() * maxWidth,
            y: Math.random() * maxHeight
        };
    }
}