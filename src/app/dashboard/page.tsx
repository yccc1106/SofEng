'use client';
import { useLanguage } from '@/lib/language';
import Image from "next/image";
import Analysis from "@/components/Dashboard/Analysis/Analysis";

export default  function DashboardPage() {
    const { t } = useLanguage();
    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center gap-4 mb-6">
                <Image
                    width={128}
                    height={128}
                    src="/images/welcome-doodle.png"
                    alt={t('Welcome')}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain opacity-90"
                />
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{t("Hello, Admin")}</h1>
                    <p className="text-gray-500 mt-1">{t('今日项目概况')}</p>
                </div>
            </div>

            <div >
                <Analysis />
            </div>
        </div>
    );
}
