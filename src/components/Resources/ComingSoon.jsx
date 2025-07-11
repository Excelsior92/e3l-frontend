import React from 'react';
import { IoBookOutline } from 'react-icons/io5';

const ComingSoon = () => {
    return (
        <div className="h-screen bg-white flex items-center justify-center p-4">
            {/* <div className="w-full max-w-2xl mx-auto text-center"> */}
            <div className="w-full max-w-2xl ml-40 mr-0 text-center">

                <div className="mb-8">
                    <IoBookOutline className="mx-auto text-[#024DAE] w-16 h-16" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Resources Coming Soon
                </h1>
                <p className="text-gray-600 mb-8">
                    We're working hard to bring you valuable resources to enhance your learning journey. Stay tuned for updates!
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        What to Expect
                    </h2>
                    <ul className="text-left text-gray-600 space-y-2">
                        <li className="flex items-start">
                            <span className="text-[#024DAE] mr-2">•</span>
                            Curated learning materials
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#024DAE] mr-2">•</span>
                            Interactive guides and tutorials
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#024DAE] mr-2">•</span>
                            Expert-recommended resources
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#024DAE] mr-2">•</span>
                            Personalized learning paths
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon; 