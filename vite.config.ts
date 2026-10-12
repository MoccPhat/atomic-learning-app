import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Cho phép truy cập từ điện thoại qua mạng LAN (e.g. 192.168.x.x:5173)
  },
});
