class GameManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameOver = false;
        this.alertShown = false;
        this.player = null;
        this.enemies = [];
        this.enemyProjectiles = [];
        this.moveRight = true;
        this.moveDown = false;
        this.lastFiredTime = 0;
        this.fireInterval = 1000;
        this.mysteryShip = null;
    }

    drawScore() {
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#fff'; // Color of the score text
        this.ctx.fillText('Score: ' + this.score, 20, 40); // Position the score text on the canvas
    }

    spawnMysteryShip() {
        if (!this.mysteryShip || !this.mysteryShip.active) {
            this.mysteryShip = new MysteryShip(this.canvas.width, 5); // Mystery ship speed is 5
        }
    }

    createEnemies() {
        const rows = 3;
        const cols = 10;
        const enemyWidth = 40;
        const enemyHeight = 40;
        const enemySpacing = 10;
        const totalWidth = cols * (enemyWidth + enemySpacing);
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = 30; // Start 30px down from the top of the canvas
        const enemyImages = {};

        for (let row = 1; row <= rows; row++) {
            enemyImages['row' + row] = new Image();
            enemyImages['row' + row].src = `SliceE${row}.png`;
        }
        // Continue for other images

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let x = startX + col * (enemyWidth + enemySpacing);
                let y = startY + row * (enemyHeight + enemySpacing);
                let image = enemyImages['row' + (row + 1)];
                let enemy = new Enemy(x, y, image);
                enemy.row = row; // Assign row index
                this.enemies.push(enemy);
            }
        }

        this.totalRows = rows; // Set total number of rows
    }

    updateEnemies() {
        let edgeReached = false;

        this.enemies.forEach(enemy => {
            enemy.move(this.moveRight, this.moveDown);

            // Check if any enemy has reached the edge
            if (enemy.x + enemy.width > this.canvas.width || enemy.x < 0) {
                edgeReached = true;
            }
        });

        if (edgeReached) {
            this.moveRight = !this.moveRight;
            this.moveDown = true;
        } else {
            this.moveDown = false;
        }

        // Random firing logic
        if (this.enemies.length > 0 && Date.now() - this.lastFiredTime > this.fireInterval) {
            const firingEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyProjectiles.push(firingEnemy.fire());
            this.lastFiredTime = Date.now();
        }
    }


    drawEnemies() {
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
    }

    checkPlayerProjectileCollisions() {
        this.player.projectiles.forEach((projectile, pIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                if (projectile.x < enemy.x + enemy.width &&
                    projectile.x > enemy.x &&
                    projectile.y < enemy.y + enemy.height &&
                    projectile.y > enemy.y) {
                    // Collision detected
                    this.player.projectiles.splice(pIndex, 1); // Remove the projectile
                    const rowScore = (this.totalRows - enemy.row) * 10; // Row 1 = 30 points, Row 2 = 20 points, Row 3 = 10 points
                    this.score += rowScore;
                    this.enemies.splice(eIndex, 1); // Remove the enemy
                }
            });
        });
    }

    checkEnemyProjectileCollisions() {
        this.enemyProjectiles.forEach((projectile) => {
            if (projectile.x < this.player.x + this.player.width &&
                projectile.x > this.player.x &&
                projectile.y < this.player.y + this.player.height &&
                projectile.y > this.player.y) {
                // Collision detected with player ship
                this.gameOver = true;
            }
        });
    }

    checkEnemyShipCollisions() {
        this.enemies.forEach((enemy) => {
            if (enemy.y + enemy.height >= this.player.y) {
                // Enemy has reached the player's ship
                this.gameOver = true;
            }
        });
    }

    checkGameCompletion() {
        if (this.enemies.length === 0) {
            this.gameOver = true;
            this.playerWon = true;
        }
    }

    checkMysteryShipCollision() {
        if (this.mysteryShip && this.mysteryShip.active) {
            this.player.projectiles.forEach((projectile, pIndex) => {
                if (projectile.x < this.mysteryShip.x + this.mysteryShip.width &&
                    projectile.x > this.mysteryShip.x &&
                    projectile.y < this.mysteryShip.y + this.mysteryShip.height &&
                    projectile.y > this.mysteryShip.y) {
                    // Collision detected
                    this.player.projectiles.splice(pIndex, 1); // Remove the projectile
                    this.score += 1000; // Award points
                    this.mysteryShip.active = false; // Deactivate the mystery ship
                }
            });
        }
    }

    start() {

        setInterval(() => this.spawnMysteryShip(), 10000); // Spawn every 10 seconds

        this.player = new Player(this.canvas.width / 2, this.canvas.height - 120, this.canvas);

        // Create enemies and add them to this.enemies array
        this.createEnemies();
        this.mainLoop();
    }

    mainLoop() {
        if (!this.gameOver) {

            this.checkPlayerProjectileCollisions();
            this.checkEnemyProjectileCollisions();
            this.checkEnemyShipCollisions();
            this.checkGameCompletion();

            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw the player
            this.player.move();
            this.player.draw(this.ctx);
            this.player.projectiles.forEach(projectile => {
                projectile.update();
                projectile.draw(this.ctx);
            });

            // Draw the enemies
            this.drawEnemies();
            this.updateEnemies();
            this.enemyProjectiles.forEach(projectile => {
                projectile.update();
                projectile.draw(this.ctx);
            });

            // Draw the mystery ship
            if (this.mysteryShip) {
                this.mysteryShip.move();
                this.mysteryShip.draw(this.ctx);
            }

            this.checkMysteryShipCollision();

            // Draw the score
            this.drawScore();

            requestAnimationFrame(() => this.mainLoop());
        } else {
            // Handle game over or game completion scenario
            if (this.playerWon) {
                // Display a winning message
                alert('Congratulations! You won!');
            } else {
                alert("Game Over!");
            }
        }
    }
}


class Player {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.canvas = canvas;
        this.width = 57; // Width of the player ship
        this.height = 90; // Height of the player ship
        this.speed = 5; // Speed of the player ship
        this.projectiles = []; // To store fired projectiles
        this.moveLeft = false;
        this.moveRight = false;
        this.image = new Image();
        this.image.src = 'Slice1.png';

        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                    // Move player left
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                    // Move player right
                    this.moveRight = true;
                    break;
                case 'ArrowUp':
                    // Player fires
                    this.fire();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                    // Move player left
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                    // Move player right
                    this.moveRight = false;
                    break;
            }
        });
    }

    move() {
        // Assuming direction is either 'left' or 'right'
        if (this.moveLeft) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (this.moveRight) {
            this.x = Math.min(this.canvas.width - this.width, this.x + this.speed);
        }


        // Optional: Prevent the player from moving off the canvas
        this.x = Math.max(0, Math.min(this.x, this.canvas.width - this.width));
    }

    fire() {
        // Create a new projectile and add it to the projectiles array
        // Assuming the projectile starts from the middle of the ship
        let projectile = new Projectile(this.x + this.width / 2, this.y, 5);
        projectile.sound.play();
        this.projectiles.push(projectile);
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);

        // Draw each projectile
        this.projectiles.forEach(projectile => {
            projectile.draw(ctx);
        });
    }
}

class Projectile {
    constructor(x, y, speed, enemyFire = false) {
        this.width = 20;
        this.height = 40;
        this.x = x - 10;
        this.y = y;
        this.speed = speed;
        this.enemyFire = enemyFire;
        this.image = new Image();
        this.image.src = enemyFire ? 'Slice8.png' : 'Slice7.png';
        this.sound = new Audio('shot.wav');
    }

    update() {
        if (this.enemyFire) {
           return this.y += this.speed;
        }
        // Move the projectile up
        this.y -= this.speed;
    }

    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.horizontalMove = 1;
        this.verticalMove = 10;
        this.image = image;
    }

    move(moveRight, moveDown) {
        if (moveRight) {
            this.x += this.horizontalMove;
        } else {
            this.x -= this.horizontalMove;
        }

        if (moveDown) {
            this.y += this.verticalMove;
        }
    }


    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    fire() {
        // Assuming the projectile starts from the middle-bottom of the enemy
        return new Projectile(this.x + this.width / 2, this.y + this.height, 3, true); // Speed of the projectile is 3
    }
}

class MysteryShip {
    constructor(canvasWidth, speed) {
        this.x = -50;
        this.y = 50;
        this.width = 50;
        this.height = 50;
        this.speed = speed;
        this.active = true; // Is the ship currently active?
        this.canvasWidth = canvasWidth;
        this.image = new Image();
        this.image.src = 'Slice6.png';
    }

    move() {
        if (this.active) {
            this.x += this.speed;
            if (this.x > this.canvasWidth) { // If it moves past the right edge
                this.active = false; // Deactivate the ship
            }
        }
    }

    draw(ctx) {
        if (this.active) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}


const game = new GameManager('gameCanvas');
game.start();
