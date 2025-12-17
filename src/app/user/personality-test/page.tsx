'use client';
import React, { useState } from 'react';
import { Card, Button, Radio, Progress, App, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

const questions = [
    {
        id: 1,
        question: "When meeting new people, you usually...",
        options: [
            { label: "Initiate conversation (E)", value: "E" },
            { label: "Wait for them to talk to you (I)", value: "I" }
        ]
    },
    {
        id: 2,
        question: "You prefer to focus on...",
        options: [
            { label: "Current realities and facts (S)", value: "S" },
            { label: "Future possibilities and meanings (N)", value: "N" }
        ]
    },
    {
        id: 3,
        question: "When making decisions, you prioritize...",
        options: [
            { label: "Logic and consistency (T)", value: "T" },
            { label: "People and special circumstances (F)", value: "F" }
        ]
    },
    {
        id: 4,
        question: "You prefer your life to be...",
        options: [
            { label: "Planned and organized (J)", value: "J" },
            { label: "Spontaneous and flexible (P)", value: "P" }
        ]
    }
    // Simple 4-question test for demo purposes to generate 4 letters
];

const PersonalityTestPage = () => {
    const { message } = App.useApp();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);

    const handleOptionSelect = (value: string) => {
        setAnswers({ ...answers, [questions[currentStep].id]: value });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const calculateResult = () => {
        // Very basic logic: Join the values. In real app, complex scoring.
        // Assuming Q1=E/I, Q2=S/N, Q3=T/F, Q4=J/P for simplicity
        const type =
            (answers[1] || 'I') +
            (answers[2] || 'N') +
            (answers[3] || 'F') +
            (answers[4] || 'P');

        let tags: string[] = [];
        if (type.includes('E')) tags.push('Outgoing');
        if (type.includes('I')) tags.push('Reflective');
        if (type.includes('S')) tags.push('Realistic');
        if (type.includes('N')) tags.push('Dreamer');
        if (type.includes('T')) tags.push('Analytical');
        if (type.includes('F')) tags.push('Empathetic');

        return { type, tags };
    };

    const handleSubmit = async () => {
        setLoading(true);
        const { type, tags } = calculateResult();

        try {
            const res = await fetch('/api/personality-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, type, tags }),
            });
            const data = await res.json();
            if (data.success) {
                message.success('Test complete! Result: ' + type);
                router.push('/user/profile');
            } else {
                message.error('Failed to save results');
            }
        } catch (error) {
            message.error('Error submitting test');
        } finally {
            setLoading(false);
        }
    };

    const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
    const currentQ = questions[currentStep];

    return (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
            <Card className="w-full shadow-md max-w-lg">
                <Title level={3} className="text-center mb-6">Personality Test</Title>
                <Progress percent={progressPercent} showInfo={false} className="mb-6" />

                <div className="mb-8">
                    <Title level={5} className="mb-4 text-gray-700">{currentStep + 1}. {currentQ.question}</Title>
                    <Radio.Group
                        onChange={e => handleOptionSelect(e.target.value)}
                        value={answers[currentQ.id]}
                        className="flex flex-col gap-3"
                    >
                        {currentQ.options.map(opt => (
                            <Radio key={opt.value} value={opt.value} className="text-base p-2 border rounded-md hover:bg-blue-50 transition-colors">
                                {opt.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </div>

                <div className="flex justify-between">
                    <Button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleNext}
                        disabled={!answers[currentQ.id]}
                        loading={loading}
                    >
                        {currentStep === questions.length - 1 ? 'Submit' : 'Next'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PersonalityTestPage;
