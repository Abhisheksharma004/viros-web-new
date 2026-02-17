import React from "react";

export interface ServiceData {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    icon: React.ReactNode;
    image: string;
    gradient: string;
    features: string[];
    benefits: { title: string; description: string }[];
    specifications?: { label: string; value: string }[];
    process: { step: number; title: string; description: string }[];
    faqs: { question: string; answer: string }[];
    brands?: { name: string; logo: string }[];
    products?: { name: string; description: string; image: string; category: string }[];
    useCases?: { industry: string; scenario: string; solution: string }[];
}

export const services: ServiceData[] = [];

