import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { LanguageProvider } from '@/lib/language';

import BasicLayout from "@/components/Layout/BasicLayout";
import { App } from 'antd';
import { AuthProvider } from "@/lib/auth-context";
import { CallProvider } from "@/components/Call/CallProvider";

export const metadata: Metadata = {
  title: "MeetU - 兴趣社区",
  description: "MeetU 兴趣社区与组队平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
      >
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                // Global Token Overrides
                colorPrimary: '#1877F2', // Match CSS --primary
                borderRadius: 8,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                colorBgLayout: '#F9FAFB', // Match CSS --surface-50
                colorTextBase: '#111827',
              },
              components: {
                Layout: {
                  bodyBg: '#F9FAFB',
                  headerBg: '#FFFFFF',
                },
                Menu: {
                  itemBorderRadius: 8,
                  itemSelectedBg: 'rgba(24, 119, 242, 0.1)',
                  itemSelectedColor: '#1877F2',
                },
                Button: {
                  borderRadius: 6,
                  controlHeight: 36,
                }
              }
            }}
          >
            <LanguageProvider>
              <App>
                <AuthProvider>
                  <CallProvider>
                    <BasicLayout>{children}</BasicLayout>
                  </CallProvider>
                </AuthProvider>
              </App>
            </LanguageProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html >
  );
}
