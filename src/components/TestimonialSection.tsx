import pool from "@/lib/db";

async function getTestimonials() {
    try {
        const [rows]: any = await pool.query(
            "SELECT * FROM testimonials WHERE status = 'Approved' ORDER BY display_order ASC"
        );
        return rows;
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }
}

export default async function TestimonialSection() {
    const testimonials = await getTestimonials();

    if (testimonials.length === 0) return null;

    return (
        <section className="py-24 bg-gray-50 overflow-hidden relative">
            {/* Background gradient blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#06b6d4]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#06124f]/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center relative z-10">
                <span className="text-[#06b6d4] font-bold tracking-wider uppercase text-sm mb-3 block text-center">
                    WHAT OUR CLIENTS SAY
                </span>
                <h2 className="text-4xl font-extrabold text-[#06124f] sm:text-5xl text-center">
                    Customer Feedback
                </h2>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto font-light text-center">
                    Don't just take our word for it. Here is what industry leaders have to say about our solutions.
                </p>
            </div>

            <div className="relative flex overflow-hidden group">
                {/* First Loop */}
                <div className="flex animate-marquee whitespace-nowrap hover:pause shrink-0" style={{ animationDuration: "35s" }}>
                    {testimonials.map((testimonial: any, index: number) => (
                        <div
                            key={testimonial.id || index}
                            className="w-[400px] mx-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shrink-0 whitespace-normal flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06b6d4]/10 to-[#06124f]/10 flex items-center justify-center text-[#06124f] font-bold text-xl shrink-0">
                                        {testimonial.name[0]}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-[#06124f] text-lg leading-tight truncate">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-500 truncate">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 italic leading-relaxed text-lg">
                                    "{testimonial.content}"
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-[#06b6d4]">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? "fill-current" : "text-gray-200"}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Second Loop (Clone) */}
                <div className="flex animate-marquee whitespace-nowrap hover:pause shrink-0" style={{ animationDuration: "35s" }}>
                    {testimonials.map((testimonial: any, index: number) => (
                        <div
                            key={`clone-${testimonial.id || index}`}
                            className="w-[400px] mx-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shrink-0 whitespace-normal flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#06b6d4]/10 to-[#06124f]/10 flex items-center justify-center text-[#06124f] font-bold text-xl shrink-0">
                                        {testimonial.name[0]}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-[#06124f] text-lg leading-tight truncate">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-500 truncate">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>

                                <p className="text-gray-600 italic leading-relaxed text-lg">
                                    "{testimonial.content}"
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-[#06b6d4]">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-5 h-5 ${i < testimonial.rating ? "fill-current" : "text-gray-200"}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
