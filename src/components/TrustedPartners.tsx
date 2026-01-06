
import Image from "next/image";

const partners = [
    { name: "Honeywell", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png" },
    { name: "Zebra Technologies", logo: "https://logowik.com/content/uploads/images/zebra-technologies2902.jpg" },
    { name: "Samsung", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png" },
    { name: "Panasonic", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png" },
    { name: "LG", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png" },
    { name: "Sony", logo: "https://logos-world.net/wp-content/uploads/2021/02/Honeywell-Emblem.png" },
];

export default function TrustedPartners() {
    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <span className="text-[#06b6d4] font-bold tracking-wider uppercase text-sm mb-2 block">
                        TRUSTED BY INDUSTRY LEADERS
                    </span>
                    <h2 className="text-4xl font-extrabold text-[#06124f] sm:text-5xl">
                        Our Strategic Partners
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        We collaborate with industry-leading companies to deliver the best solutions for your business.
                    </p>
                </div>

                <div className="relative flex overflow-hidden group">
                    <div className="flex animate-marquee whitespace-nowrap shrink-0" style={{ animationDuration: "40s" }}>
                        {partners.map((partner, index) => (
                            <div
                                key={index}
                                className="mx-8 flex items-center justify-center h-24 w-40 shrink-0"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex animate-marquee whitespace-nowrap shrink-0" style={{ animationDuration: "40s" }}>
                        {partners.map((partner, index) => (
                            <div
                                key={`clone-${index}`}
                                className="mx-8 flex items-center justify-center h-24 w-40 shrink-0"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={partner.logo}
                                        alt={partner.name}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
