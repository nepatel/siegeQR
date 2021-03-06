const FPS = 60;
const HEIGHT = 450;
const WIDTH = 1000;

// indices for result array returned by calc_traj
const RNG = 0;
const HGHT = 1;
const T = 2;
const UP_T = 3;
const DN_T = 4;
const VX = 5;
const VY = 6;
const IMP_SPD = 7;

// acceleration of gravity that 'feels natural' in game
// 4 times the gravity of earth
const gravity = 4 * 9.81;

function Player(x, y) {
  this.x = x;
  this.y = y;

  this.spdX = 0;
  this.spdY = 0;

  this.width = c.width / 20;
  this.height = c.height / 5;

  this.lvlHght = 0;
  this.maxHght = 0;

  this.dmg = 1;
  this.spd = 1;
  this.imp = 1;

  this.angle = 0;
  this.velocity = 0;

  this.projectiles = [];

  this.update = function (ctx) {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };

  this.drawArc = function (ctx) {
    let trajData = calcTraj(this.velocity, this.angle, this.lvlHght);
    ctx.fillStyle = "grey";
    ctx.moveTo(0, 100);
    // ctx.quadraticCurveTo(this.x, trajData[HGHT], 0, trajData[RNG]);
    ctx.quadraticCurveTo(trajData[RNG], 200, 50, 200);
    ctx.fill();
  };

  // ATTACK METHODS
  this.attack = function (ctx) {
    this.projectiles.push(new Projectile(this, this.velocity, this.angle, 0));
  };

  this.updateAtk = function (ctx) {
    this.projectiles.forEach((p) => {
      // if the update function returns 1,
      // then the projectile is destroyed so stop updating it
      if (p.update(ctx)) {
        let index = this.projectiles.indexOf(p);
        this.projectiles.splice(index, 1);
        console.log("PROJECTILE DELETED")
      };
    });
  };
}

function Projectile(player, v, a, h) {
  this.player = player;

  this.width = 20;
  this.height = 20;

  this.x = player.x + 40;
  this.y = player.y;

  this.velocity = v;
  this.angle = a;
  this.pHeight = h;

  this.range;
  this.maxHeight;
  this.totalTime;
  this.upTime;
  this.downTime;
  this.velocityX;
  this.velocityY;
  this.impactSpd;

  this.time = 0;
  this.rising = true;

  this.update = function (ctx) {
    ctx.fillStyle = "white";

    let trajData = calcTraj(this.velocity, this.angle, this.height);
    this.setTrajData(trajData);

    if (this.moveProjectile(ctx)) {
      return 1;
    };

    ctx.fillRect(this.x, this.y, this.width, this.height);
  };

  this.moveProjectile = function (ctx) {
    // move along x-axis
    this.time += 1 / 60;
    // this.x += this.velocityX * this.time * Math.cos(this.theta);

    this.x += this.velocityX * this.time;

    // check if this has reached maxHeight of projectile arc
    if (this.y <= this.maxHeight) {
      this.rising = false;
      console.log("peak reached");
    }

    // move along y-axis (up if rising, down if not rising)
    this.y -= this.velocityY * this.time - 0.5 * gravity * this.time ** 2;

    // c collision with ground or 
    if (! this.inBound(ctx)) {
      if (this.isImpact(ctx)) {
        return this.explodeProj(ctx);
      } else {
        return this.deleteProj(ctx);
      }
    }
  };

  this.inBound = function (ctx) {
    // check if projectile is past left-most or right-most boundary
    if (this.x <= 0 || this.x >= WIDTH) {
      console.log("OUT OF X-BOUNDS")
      return false;
    }
    // check if projectile is past lower-most or upper-most boundary
    if (this.y <= -50 || this.y >= HEIGHT) {
      console.log("OUT OF Y-BOUNDS")
      return false;
    }
    // projectile is within bounds
    return true;
  }

  this.isImpact = function (ctx) {
    if (this.y >= ctx.height) {
      return true;
    }
  }

  this.explodeProj = function (ctx) {
    // draw explosion
    return this.deleteProj();
  }

  this.deleteProj = function (ctx) {
    return 1;
  }

  this.setTrajData = function (trajData) {
    this.range = trajData[RNG];
    this.maxHeight = trajData[HGHT];
    this.totalTime = trajData[T];
    this.upTime = trajData[UP_T];
    this.downTime = trajData[DN_T];
    this.velocityX = trajData[VX];
    this.velocityY = trajData[VY];
    this.impactSpd = trajData[IMP_SPD];
  };
}

var calcTraj = function (velocity, angle, height) {
  // convert degrees to radians (theta)
  let theta = (Math.PI * angle) / 180.0;

  // calc initial horizontal and vertical velocities
  let velocityX = velocity * Math.cos(theta);
  let velocityY = velocity * Math.sin(theta);

  // calc when vertical velocity becomes 0 to determine time to maximum height
  let upTime = velocityY / gravity;

  // substitute upT for t in vertical motion equation to calculate max height
  let maxHeight = height + velocityY * upTime - 0.5 * gravity * upTime ** 2;

  // time from maximum height to impact
  let downTime = Math.sqrt((2 * maxHeight) / gravity);

  // total flight time
  let totalTime = upTime + downTime;

  // the maximum range (distance to impact)
  let range = velocityX * totalTime;

  // projectile speed at impact
  let impactSpd = Math.sqrt(velocityX ** 2 + (gravity * downTime) ** 2);

  // console.log("upward time: " + upTime + "\n");
  // console.log("downward time: " + downTime + "\n");
  // console.log("max height: " + maxHeight + "\n");
  // console.log("flight time: "  + time + "\n");
  // console.log("range: " + range + "\n");
  // console.log("impact speed: " + impactSpd + "\n");

  return [
    range,
    maxHeight,
    totalTime,
    upTime,
    downTime,
    velocityX,
    velocityY,
    impactSpd,
  ];
};

// MOVEMENT METHODS
// this.newPos = function () {
//   this.lmtSpd();
//   this.x += this.spdX;
//   this.y += this.spdY;
//   this.inBound();
// };

// limit movement spd to MAX_SPD
// this.lmtSpd = function () {
//   if (this.spdX > MAX_SPD) {
//     this.spdX = MAX_SPD;
//   } else if (this.spdX < -MAX_SPD) {
//     this.spdX = -MAX_SPD;
//   }
//   if (this.spdY > MAX_SPD) {
//     this.spdY = MAX_SPD;
//   } else if (this.spdY < -MAX_SPD) {
//     this.spdY = -MAX_SPD;
//   }
// };

// this.inBound = function () {
//   if (this.x < 0) {
//     this.x = 0;
//   } else if (this.x > c.width - this.width) {
//     this.x = c.width - this.width;
//   }
//   if (this.y < 0) {
//     this.y = 0;
//   } else if (this.y > c.height - this.height) {
//     this.y = c.height - this.height;
//   }
// };

export { Player as default };
