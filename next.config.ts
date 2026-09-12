import type { NextConfig } from "next";
import os from "os";

// ฟังก์ชันดึงเลข IP ของเครื่องคอมพิวเตอร์ ณ ปัจจุบัน
const getNetworkIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
};

const nextConfig: NextConfig = {
  // นำ IP ที่หาเจอมาอนุญาตให้โหลด JavaScript ได้อัตโนมัติ
  allowedDevOrigins: getNetworkIPs(),
};

export default nextConfig;