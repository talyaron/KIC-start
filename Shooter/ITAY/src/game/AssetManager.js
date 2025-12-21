// Asset Manager for loading and caching game assets

class AssetManager {
    constructor() {
        this.assets = {};
        this.isLoading = false;
        this.onComplete = null;
    }

    /**
     * Load game assets
     * @returns {Promise} Promise that resolves when all assets are loaded
     */
    async loadAssets() {
        if (this.isLoading) return;
        this.isLoading = true;

        const assetList = [
            { id: 'asteroid', src: 'assets/asteroid.png', removeBlack: true },
            { id: 'spaceship', src: 'assets/spaceship.png', removeBlack: true },
            { id: 'missile', src: 'assets/missile.png', removeBlack: true },
            { id: 'space_bg', src: 'assets/space_bg.png' }
        ];

        const loadPromises = assetList.map(asset => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    if (asset.removeBlack) {
                        this.assets[asset.id] = this.processTransparency(img);
                    } else {
                        this.assets[asset.id] = img;
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: ${asset.src}`);
                    reject();
                };
                img.src = asset.src;
            });
        });

        try {
            await Promise.all(loadPromises);
            console.log('✅ All assets loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load some assets', error);
        } finally {
            this.isLoading = false;
            if (this.onComplete) this.onComplete();
        }
    }

    /**
     * Process an image to make black pixels transparent
     * @param {HTMLImageElement} img - Source image
     * @returns {HTMLCanvasElement} Processed image
     */
    processTransparency(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Use brightness to determine transparency for smoother edges
            const brightness = (r + g + b) / 3;

            if (brightness < 20) {
                data[i + 3] = 0;
            } else if (brightness < 45) {
                // Smoothly fade out dark edges instead of hard cut
                const alpha = (brightness - 20) / 25;
                data[i + 3] = Math.floor(alpha * 255);
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Get an asset by ID
     * @param {string} id - Asset ID
     * @returns {HTMLImageElement|HTMLCanvasElement|null} The asset image
     */
    get(id) {
        return this.assets[id] || null;
    }
}

export const assets = new AssetManager();
