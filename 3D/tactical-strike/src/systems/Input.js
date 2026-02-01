class Input {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.buttons = {};

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousedown', (e) => this.buttons[e.button] = true);
        window.addEventListener('mouseup', (e) => this.buttons[e.button] = false);
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    isPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isMouseDown(button) {
        return !!this.buttons[button];
    }
}

export default Input;
