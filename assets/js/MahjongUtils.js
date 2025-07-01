// MahjongUtils.js - Common utility functions for Mahjong games with mobile support
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
        
        // Add touch-action CSS for better mobile handling
        tile.style.touchAction = 'none';
        tile.style.userSelect = 'none';
        
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
     * Gets the coordinates from either a mouse or touch event
     * @param {Event} event - Mouse or touch event
     * @returns {Object} Object with clientX and clientY coordinates
     */
    static getEventCoordinates(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            };
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            return {
                clientX: event.changedTouches[0].clientX,
                clientY: event.changedTouches[0].clientY
            };
        }
        return {
            clientX: event.clientX,
            clientY: event.clientY
        };
    }

    /**
     * Gets the element at the given coordinates, accounting for touch events
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {HTMLElement} excludeElement - Element to exclude from search
     * @returns {HTMLElement} Element at the coordinates
     */
    static getElementFromPoint(x, y, excludeElement = null) {
        if (excludeElement) {
            const originalDisplay = excludeElement.style.display;
            excludeElement.style.display = 'none';
            const element = document.elementFromPoint(x, y);
            excludeElement.style.display = originalDisplay;
            return element;
        }
        return document.elementFromPoint(x, y);
    }

    /**
     * Sets up unified drag and drop / touch event listeners for mobile and desktop
     * @param {Object} handlers - Object containing handler functions
     * @param {Function} handlers.dragStart - Drag/touch start handler
     * @param {Function} handlers.dragOver - Drag over / touch move handler
     * @param {Function} handlers.dragLeave - Drag leave handler (optional)
     * @param {Function} handlers.drop - Drop / touch end handler
     * @param {Function} handlers.dragEnd - Drag end handler (optional)
     */
    static setupDragAndDrop(handlers) {
        let isDragging = false;
        let draggedElement = null;
        let currentDropTarget = null;

        // Enhanced drag start handler that works with both mouse and touch
        const unifiedDragStart = (event) => {
            // Handle both mouse drag start and touch start
            if (event.type === 'dragstart' || event.type === 'touchstart') {
                
                // For touch events, we need to identify the dragged element
                if (event.type === 'touchstart') {
                    const coords = this.getEventCoordinates(event);
                    draggedElement = this.getElementFromPoint(coords.clientX, coords.clientY);
                    
                    // Check if the touched element is draggable or a tile
                    const isDraggableElement = draggedElement && (
                        draggedElement.draggable === true ||
                        draggedElement.classList.contains('mahjong-tile') ||
                        draggedElement.dataset.tileId
                    );
                    
                    // Check if it's a button or other interactive element that shouldn't be dragged
                    const isClickableElement = draggedElement && (
                        draggedElement.tagName === 'BUTTON' ||
                        draggedElement.tagName === 'A' ||
                        draggedElement.tagName === 'INPUT' ||
                        draggedElement.type === 'button' ||
                        draggedElement.type === 'submit' ||
                        draggedElement.role === 'button' ||
                        draggedElement.classList.contains('btn') ||
                        draggedElement.classList.contains('button')
                    );
                    
                    // If it's a clickable element, don't start dragging
                    if (isClickableElement || !isDraggableElement) {
                        isDragging = false;
                        return;
                    }
                    
                    isDragging = true;
                    
                    // Create a synthetic drag start event for touch
                    const syntheticEvent = {
                        ...event,
                        type: 'dragstart',
                        target: draggedElement,
                        dataTransfer: {
                            setData: (type, data) => {
                                // Store the data for later retrieval
                                if (!syntheticEvent._dragData) {
                                    syntheticEvent._dragData = {};
                                }
                                syntheticEvent._dragData[type] = data;
                            },
                            getData: (type) => {
                                return syntheticEvent._dragData ? syntheticEvent._dragData[type] : null;
                            }
                        }
                    };
                    
                    // Prevent default touch behaviors only for draggable elements
                    event.preventDefault();
                    
                    if (handlers.dragStart) {
                        handlers.dragStart(syntheticEvent);
                    }
                } else {
                    isDragging = true;
                    draggedElement = event.target;
                    if (handlers.dragStart) {
                        handlers.dragStart(event);
                    }
                }
            }
        };

        // Enhanced drag over handler for touch move
        const unifiedDragOver = (event) => {
            if (event.type === 'dragover' || (event.type === 'touchmove' && isDragging)) {
                event.preventDefault();
                
                if (event.type === 'touchmove') {
                    const coords = this.getEventCoordinates(event);
                    const elementBelow = this.getElementFromPoint(coords.clientX, coords.clientY, draggedElement);
                    
                    // Simulate dragover for the element below
                    if (elementBelow && elementBelow !== currentDropTarget) {
                        if (currentDropTarget && handlers.dragLeave) {
                            const leaveEvent = {
                                type: 'dragleave',
                                target: currentDropTarget
                            };
                            handlers.dragLeave(leaveEvent);
                        }
                        
                        currentDropTarget = elementBelow;
                        const overEvent = {
                            type: 'dragover',
                            target: elementBelow,
                            clientX: coords.clientX,
                            clientY: coords.clientY,
                            preventDefault: () => {}
                        };
                        
                        if (handlers.dragOver) {
                            handlers.dragOver(overEvent);
                        }
                    }
                } else if (handlers.dragOver) {
                    handlers.dragOver(event);
                }
            }
        };

        // Enhanced drop handler for touch end
        const unifiedDrop = (event) => {
            if (event.type === 'drop' || (event.type === 'touchend' && isDragging)) {
                event.preventDefault();
                
                if (event.type === 'touchend') {
                    const coords = this.getEventCoordinates(event);
                    const dropTarget = this.getElementFromPoint(coords.clientX, coords.clientY, draggedElement);
                    
                    if (dropTarget) {
                        const dropEvent = {
                            type: 'drop',
                            target: dropTarget,
                            clientX: coords.clientX,
                            clientY: coords.clientY,
                            preventDefault: () => {},
                            dataTransfer: {
                                getData: (type) => {
                                    // Return the tile ID for the dragged element
                                    if (type === 'text/plain' && draggedElement) {
                                        return draggedElement.dataset.tileId || null;
                                    }
                                    return null;
                                }
                            }
                        };
                        
                        if (handlers.drop) {
                            handlers.drop(dropEvent);
                        }
                    }
                } else if (handlers.drop) {
                    handlers.drop(event);
                }

                // Reset drag state
                isDragging = false;
                draggedElement = null;
                currentDropTarget = null;
            }
        };

        // Enhanced drag end handler
        const unifiedDragEnd = (event) => {
            if (event.type === 'dragend' || event.type === 'touchend') {
           
                if (handlers.dragEnd) {
                   const realTarget = draggedElement || event.target;
                    const syntheticEvent = event.type === 'touchend' ? {
                        type: 'dragend',
                        target: realTarget
                    } : event;
                    handlers.dragEnd(syntheticEvent);
                }
                isDragging = false;
                draggedElement = null;
                currentDropTarget = null;
            }
        };

        // Add mouse event listeners
        if (handlers.dragStart) {
            document.addEventListener('dragstart', unifiedDragStart);
        }
        if (handlers.dragOver) {
            document.addEventListener('dragover', unifiedDragOver);
        }
        if (handlers.dragLeave) {
            document.addEventListener('dragleave', handlers.dragLeave);
        }
        if (handlers.drop) {
            document.addEventListener('drop', unifiedDrop);
        }
        if (handlers.dragEnd) {
            document.addEventListener('dragend', unifiedDragEnd);
        }

        // Add touch event listeners with better event filtering
        const touchStartHandler = (event) => {
            // Only process touch events on draggable elements
            const target = event.target;
            const isDraggableElement = target && (
                target.draggable === true ||
                target.classList.contains('mahjong-tile') ||
                target.dataset.tileId
            );
            
            if (isDraggableElement) {
                unifiedDragStart(event);
            }
        };
        
        document.addEventListener('touchstart', touchStartHandler, { passive: false });
        document.addEventListener('touchmove', unifiedDragOver, { passive: false });
        document.addEventListener('touchend', unifiedDrop, { passive: false });
        document.addEventListener('touchend', unifiedDragEnd, { passive: false });

        // Store references for cleanup
        this._dragHandlers = {
            unifiedDragStart,
            unifiedDragOver,
            unifiedDrop,
            unifiedDragEnd,
            touchStartHandler,
            originalHandlers: handlers
        };
    }

    /**
     * Removes drag and drop event listeners
     * @param {Object} handlers - Object containing handler functions to remove
     */
    static removeDragAndDrop(handlers) {
        if (this._dragHandlers) {
            const { unifiedDragStart, unifiedDragOver, unifiedDrop, unifiedDragEnd, touchStartHandler, originalHandlers } = this._dragHandlers;
            
            // Remove mouse event listeners
            if (originalHandlers.dragStart) {
                document.removeEventListener('dragstart', unifiedDragStart);
            }
            if (originalHandlers.dragOver) {
                document.removeEventListener('dragover', unifiedDragOver);
            }
            if (originalHandlers.dragLeave) {
                document.removeEventListener('dragleave', originalHandlers.dragLeave);
            }
            if (originalHandlers.drop) {
                document.removeEventListener('drop', unifiedDrop);
            }
            if (originalHandlers.dragEnd) {
                document.removeEventListener('dragend', unifiedDragEnd);
            }

            // Remove touch event listeners
            document.removeEventListener('touchstart', touchStartHandler);
            document.removeEventListener('touchmove', unifiedDragOver);
            document.removeEventListener('touchend', unifiedDrop);
            document.removeEventListener('touchend', unifiedDragEnd);

            delete this._dragHandlers;
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
    
    static buildTileMap() {
        return {
            // Bamboo tiles
            'B1': 'bam-1.svg', 'B2': 'bam-2.svg', 'B3': 'bam-3.svg', 'B4': 'bam-4.svg', 'B5': 'bam-5.svg',
            'B6': 'bam-6.svg', 'B7': 'bam-7.svg', 'B8': 'bam-8.svg', 'B9': 'bam-9.svg',
            
            // Character tiles
            'C1': 'crak-1.svg', 'C2': 'crak-2.svg', 'C3': 'crak-3.svg', 'C4': 'crak-4.svg', 'C5': 'crak-5.svg',
            'C6': 'crak-6.svg', 'C7': 'crak-7.svg', 'C8': 'crak-8.svg', 'C9': 'crak-9.svg',
            
            // Dot tiles
            'D1': 'dot-1.svg', 'D2': 'dot-2.svg', 'D3': 'dot-3.svg', 'D4': 'dot-4.svg', 'D5': 'dot-5.svg',
            'D6': 'dot-6.svg', 'D7': 'dot-7.svg', 'D8': 'dot-8.svg', 'D9': 'dot-9.svg',
            
            // Wind tiles
            'E': 'east.svg',
            'S': 'south.svg',
            'W': 'west.svg',
            'N': 'north.svg',
            
            // Dragon tiles
            'DD': 'crak-dragon.svg',   // Red dragon
            'BD': 'dot-dragon.svg',   // White dragon
            'CD': 'bam-dragon.svg',   // Green dragon
            
            // Special tiles
            'JK': 'joker.svg',
            'FL': 'flower.svg'
        };
    }
    
    static playClick() {
    if (!this._ac) {
      this._ac = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = this._ac.currentTime;
    const osc = this._ac.createOscillator();
    const gain = this._ac.createGain();
    osc.connect(gain);
    gain.connect(this._ac.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}