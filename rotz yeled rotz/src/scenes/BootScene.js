import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load real assets from /assets/ (which maps to public/assets/ in Vite)
        this.load.image('sky', '/assets/sky.png');
        this.load.image('forest', '/assets/forest.png');
        this.load.image('tiles', '/assets/tileset.png');
        this.load.image('coin', '/assets/coin.png');
        this.load.spritesheet('characters', '/assets/characters.png', { frameWidth: 128, frameHeight: 160 });

        // Manual completion handling
        this.load.on('complete', () => {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });

            // 1. Runtime Transparency: Remove solid backgrounds from loaded PNGs
            const cleanTexture = (key) => {
                const tex = this.textures.get(key);
                if (!this.textures.exists(key) || tex.key === '__MISSING') return;

                const source = tex.getSourceImage();
                if (!source || !source.width || source.width <= 1) return;

                const canvas = document.createElement('canvas');
                canvas.width = source.width;
                canvas.height = source.height;
                // Performance fix: Use willReadFrequently for heavy canvas reading
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(source, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Identify background color from top-left pixel (usually the background)
                const br = data[0], bg = data[1], bb = data[2];
                const tolerance = 40;

                for (let i = 0; i < data.length; i += 4) {
                    const diff = Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
                    if (diff < tolerance) {
                        data[i + 3] = 0;
                    }
                }
                ctx.putImageData(imageData, 0, 0);

                // CRITICAL: Clean up and re-add with correct metadata
                this.textures.remove(key);
                if (key === 'characters') {
                    this.textures.addSpriteSheet(key, canvas, { frameWidth: 128, frameHeight: 160 });
                } else {
                    this.textures.addCanvas(key, canvas);
                }
            };

            ['characters', 'coin', 'tiles', 'forest', 'sky'].forEach(cleanTexture);

            // 2. High-Quality Fallbacks: Use gradients/patterns instead of solid blocks
            const generateFancyFallback = (key, width, height, colors) => {
                const tex = this.textures.get(key);
                // Aggressive check: if it's missing, has no pixels, or is the default stub
                const isBroken = !this.textures.exists(key) ||
                    tex.key === '__MISSING' ||
                    !tex.getSourceImage() ||
                    tex.getSourceImage().width <= 32;

                if (!isBroken) return;

                // If it was the missing stub, we remove it to replace with our canvas
                if (this.textures.exists(key)) this.textures.remove(key);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);

                // Add some subtle detail/noise
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                for (let i = 0; i < 20; i++) ctx.fillRect(Math.random() * width, Math.random() * height, 4, 4);

                this.textures.addCanvas(key, canvas);
            };

            generateFancyFallback('sky', 128, 128, ['#0f0c29', '#302b63', '#24243e']);
            generateFancyFallback('forest', 256, 256, ['#134e5e', '#71b280']);

            // Ground/Tiles fallback with pattern
            const generateTiles = () => {
                const tex = this.textures.get('tiles');
                if (this.textures.exists('tiles') && tex.key !== '__MISSING' && tex.getSourceImage().width > 1) return;

                if (this.textures.exists('tiles')) this.textures.remove('tiles');
                if (this.textures.exists('ground_fallback')) this.textures.remove('ground_fallback');
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#3d2b1f'; ctx.fillRect(0, 0, 128, 128);
                ctx.fillStyle = '#241d13'; ctx.fillRect(0, 64, 128, 64);
                ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 128, 128);
                this.textures.addCanvas('tiles', canvas);
                this.textures.addCanvas('ground_fallback', canvas);
            };
            generateTiles();

            generateFancyFallback('coin', 32, 32, ['#f8ff00', '#dbb400']);
            generateFancyFallback('enemy', 32, 32, ['#8e44ad', '#9b59b6']);

            // Final safety: if characters failed, generate a minimal spritesheet fallback
            if (!this.textures.exists('characters') || this.textures.get('characters').key === '__MISSING') {
                const canvas = document.createElement('canvas');
                canvas.width = 1024; canvas.height = 1024; // Big enough for multiple frames
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#3498db'; ctx.fillRect(0, 0, 1024, 1024);
                this.textures.addSpriteSheet('characters', canvas, { frameWidth: 128, frameHeight: 160 });
            }

            this.scene.start('MainMenuScene');
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading asset:', file.src);
        });
    }
}
