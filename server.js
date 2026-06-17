const { WebSocketServer } = require('ws');

// Render 会自动分配端口，如果没有就默认使用 8080
const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

console.log(`WebSocket 服务器正在运行，端口：${port}`);

// 存储当前所有座位的状态（键是座位ID，值是状态，比如 'occupied'）
let seatState = {};

wss.on('connection', (ws) => {
  console.log('有新的同学连接进来了！');

  // 1. 新同学刚进来时，把当前的最新座位状态同步发给他们
  ws.send(JSON.stringify({ type: 'init', data: seatState }));

  // 2. 监听某一个同学发来的“占座”或“退座”消息
  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);

      if (parsed.type === 'seat_change') {
        // 更新服务器上的座位状态
        const { seatId, status } = parsed.data;
        seatState[seatId] = status;

        // 3. 广播给所有人
        wss.clients.forEach((client) => {
          if (client.readyState === 1) { // 1 代表连接处于打开状态
            client.send(JSON.stringify({
              type: 'broadcast_change',
              data: { seatId, status }
            }));
          }
        });
      }
    } catch (err) {
      console.error('解析消息失败:', err);
    }
  });

  ws.on('close', () => {
    console.log('同学断开了连接');
  });
});
