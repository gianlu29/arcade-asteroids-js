// Minimal Asteroids-like game (very small)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

let W = window.innerWidth * 0.8;
let H = Math.min(window.innerHeight * 0.7, 700);
canvas.width = W; canvas.height = H;

window.addEventListener('resize', () => {
  W = window.innerWidth * 0.8;
  H = Math.min(window.innerHeight * 0.7, 700);
  canvas.width = W; canvas.height = H;
});

const rand = (a,b)=> Math.random()*(b-a)+a;

class Ship {
  constructor(){ this.x=W/2; this.y=H/2; this.r=12; this.a= -Math.PI/2; this.vx=0; this.vy=0; this.thrust=false; }
  update(dt){
    if(this.thrust){ this.vx += Math.cos(this.a)*0.15*dt; this.vy += Math.sin(this.a)*0.15*dt; }
    this.x += this.vx*dt; this.y += this.vy*dt;
    this.x = (this.x+W)%W; this.y = (this.y+H)%H;
    // friction
    this.vx *= 0.995; this.vy *= 0.995;
  }
  draw(){
    ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.a);
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-10,8); ctx.lineTo(-6,0); ctx.lineTo(-10,-8); ctx.closePath();
    ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.restore();
  }
}

class Rock {
  constructor(){
    this.r = rand(15,40);
    this.x = rand(0,W); this.y = rand(0,H);
    const s = rand(0.5,1.5);
    this.vx = rand(-0.3,0.3)*s; this.vy = rand(-0.3,0.3)*s;
  }
  update(dt){ this.x=(this.x+this.vx*dt+W)%W; this.y=(this.y+this.vy*dt+H)%H; }
  draw(){ ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.stroke(); }
}

const ship = new Ship();
let rocks = Array.from({length:6},()=> new Rock());
let bullets = [];
let score = 0, lives = 3;

const keys = {};
window.addEventListener('keydown', e=> keys[e.code]=true);
window.addEventListener('keyup', e=> keys[e.code]=false);

function fire(){
  bullets.push({
    x: ship.x + Math.cos(ship.a)*18,
    y: ship.y + Math.sin(ship.a)*18,
    vx: ship.vx + Math.cos(ship.a)*6,
    vy: ship.vy + Math.sin(ship.a)*6,
    life: 60
  });
}

let last = performance.now();
function loop(now){
  const dt = Math.min((now-last)/16.67, 4); last = now;
  // input
  if(keys['ArrowLeft']) ship.a -= 0.08*dt;
  if(keys['ArrowRight']) ship.a += 0.08*dt;
  ship.thrust = !!keys['ArrowUp'];
  if(keys['Space'] && (!loop._cool || now - loop._cool > 200)) { fire(); loop._cool = now; }

  ship.update(dt);
  rocks.forEach(r=> r.update(dt));
  bullets.forEach(b => { b.x=(b.x+b.vx*dt+W)%W; b.y=(b.y+b.vy*dt+H)%H; b.life--; });
  bullets = bullets.filter(b=> b.life>0);

  // collision bullets-rocks
  for(let i=rocks.length-1;i>=0;i--){
    for(let j=bullets.length-1;j>=0;j--){
      const dx = rocks[i].x - bullets[j].x;
      const dy = rocks[i].y - bullets[j].y;
      const d = Math.hypot(dx,dy);
      if(d < rocks[i].r){
        // destroy
        rocks.splice(i,1);
        bullets.splice(j,1);
        score += 100;
        break;
      }
    }
  }

  // ship-rock collision (simple)
  for(let r of rocks){
    const d = Math.hypot(r.x-ship.x, r.y-ship.y);
    if(d < r.r + ship.r){
      lives--; // simple penalty
      ship.x = W/2; ship.y = H/2; ship.vx = ship.vy = 0;
      break;
    }
  }

  // spawn more rocks if none
  if(rocks.length === 0){
    rocks = Array.from({length:6},()=> new Rock());
  }

  // draw
  ctx.clearRect(0,0,W,H);
  ship.draw();
  rocks.forEach(r=> r.draw());
  bullets.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x,b.y,2,0,Math.PI*2); ctx.fill();
  });

  hud.textContent = `Score: ${score} | Lives: ${lives}`;
  if(lives <= 0){
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,H/2-40,W,80);
    ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font='24px sans-serif';
    ctx.fillText('Game Over — Ricarica la pagina per riavviare', W/2, H/2+8);
    return;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
