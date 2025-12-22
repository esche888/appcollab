'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Users, Lightbulb, Search, MessageSquare, Award, User, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
    const [openSection, setOpenSection] = useState<string | null>('introduction')

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section)
    }

    return (
        <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-teal/10 via-appcollab-blue/10 to-appcollab-green-light/10">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue-dark bg-clip-text text-transparent mb-4">
                        How to Use AppCollab
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Welcome! AppCollab is a community space where ideas come to life.
                        Whether you have a brilliant concept or want to help build someone else's, this guide will get you started.
                    </p>
                </div>

                <div className="space-y-6">

                    {/* Introduction Section */}
                    <HelpSection
                        id="introduction"
                        title="What is AppCollab?"
                        icon={<BookOpen className="h-6 w-6 text-appcollab-blue" />}
                        isOpen={openSection === 'introduction'}
                        onToggle={() => toggleSection('introduction')}
                    >
                        <p className="mb-4">
                            AppCollab connects people with <strong>Ideas</strong> to people with <strong>Skills</strong>.
                        </p>
                        <p className="mb-4">
                            In traditional software development, "Technical" people (developers) and "Non-Technical" people (visionaries, designers, marketers) often struggle to find each other. AppCollab bridges that gap.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>For Visionaries:</strong> Post your project idea, describe what's missing, and find willing contributors.</li>
                            <li><strong>For Contributors:</strong> Browse projects, find "Gaps" (roles that need filling), and join a team to build your portfolio.</li>
                        </ul>
                    </HelpSection>

                    {/* Projects Section */}
                    <HelpSection
                        id="projects"
                        title="Navigating Projects"
                        icon={<Target className="h-6 w-6 text-appcollab-teal" />}
                        isOpen={openSection === 'projects'}
                        onToggle={() => toggleSection('projects')}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Finding a Project</h3>
                        <p className="mb-4">
                            The <strong>Projects</strong> page is your main dashboard. You can see all active ideas here.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                            <li><strong>Filters:</strong> Use the top bar to filter by Status (e.g., "Idea", "In Progress") or Owner.</li>
                            <li><strong>Reset:</strong> If you get lost in filters, hit the "Reset Filters" button to see everything again.</li>
                            <li><strong>Favorites:</strong> Click the heart icon on any project card to save it to your personal favorites list.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating a Project</h3>
                        <p className="mb-4">
                            Have an idea? Click the <strong>New Project</strong> button on the Projects page. You'll need to provide:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>Title & Description:</strong> Be catchy but clear!</li>
                            <li><strong>Status:</strong> Usually starts as an "Idea".</li>
                            <li><strong>Repository Links:</strong> Optional. If you have code on GitHub or a website, link it here.</li>
                        </ul>
                    </HelpSection>

                    {/* Gaps Section */}
                    <HelpSection
                        id="gaps"
                        title="Understanding 'Help Needed' (Gaps)"
                        icon={<Users className="h-6 w-6 text-appcollab-orange" />}
                        isOpen={openSection === 'gaps'}
                        onToggle={() => toggleSection('gaps')}
                    >
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                            <p className="text-orange-800 font-medium">
                                This is the most important concept in AppCollab!
                            </p>
                        </div>
                        <p className="mb-4">
                            A <strong>Gap</strong> is simply a specific role or task that a project needs help with.
                        </p>
                        <p className="mb-4">
                            When viewing a project details page, look for the <strong>Help Needed</strong> section. You might see cards like:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                            <li><strong>UX Design:</strong> "Need a logo and color scheme."</li>
                            <li><strong>Development:</strong> "Need someone to build the login page."</li>
                            <li><strong>Marketing:</strong> "Need help writing a launch post."</li>
                        </ul>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Help</h3>
                        <p>
                            If you see a Gap that matches your skills, click the <strong>Tag Yourself</strong> button. This signals to the project owner that you are interested in filling that role!
                        </p>
                    </HelpSection>

                    {/* Feature Suggestions Section */}
                    <HelpSection
                        id="suggestions"
                        title="Feature Suggestions & Voting"
                        icon={<Lightbulb className="h-6 w-6 text-appcollab-green-light" />}
                        isOpen={openSection === 'suggestions'}
                        onToggle={() => toggleSection('suggestions')}
                    >
                        <p className="mb-4">
                            Even if you can't build it personally, you can help shape a project!
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>Suggest Features:</strong> On a project page, open the "Feature Suggestions" panel to propose a new idea for that app.</li>
                            <li><strong>Vote:</strong> See a suggestion you like? Click the arrow icon to upvote it. This helps owners prioritize what to build next.</li>
                        </ul>
                    </HelpSection>

                    {/* Best Practices Section */}
                    <HelpSection
                        id="best-practices"
                        title="Best Practices"
                        icon={<Award className="h-6 w-6 text-purple-600" />}
                        isOpen={openSection === 'best-practices'}
                        onToggle={() => toggleSection('best-practices')}
                    >
                        <p className="mb-4">
                            The <strong>Best Practices</strong> page is a library of shared wisdom. It contains guidelines on how to build great software, interact with teams, and manage projects.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>Read & Learn:</strong> Browse guidelines on Design, Security, Accessibility, and more.</li>
                            <li><strong>Request Topics:</strong> Don't see what you need? Use the "Request a Topic" panel to ask the community to write about something specific.</li>
                        </ul>
                    </HelpSection>

                    {/* Profile Section */}
                    <HelpSection
                        id="profile"
                        title="Your Profile"
                        icon={<User className="h-6 w-6 text-gray-600" />}
                        isOpen={openSection === 'profile'}
                        onToggle={() => toggleSection('profile')}
                    >
                        <p className="mb-4">
                            Your profile is your digital resume on AppCollab.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            <li><strong>Bio:</strong> Tell people who you are and what you're passionate about.</li>
                            <li><strong>Skills:</strong> List your capabilities (e.g., "Writing", "Python", "Project Management"). This helps project owners know if you're a good fit for their Gaps.</li>
                            <li><strong>Contributions:</strong> Your profile automatically tracks the projects you are contributing to.</li>
                        </ul>
                    </HelpSection>

                </div>

                <div className="mt-12 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                    <p className="text-gray-600 mb-4">
                        We are always looking to improve. Check the Feedback section on any project to let us know what you think.
                    </p>
                    <Button className="bg-appcollab-blue text-white hover:bg-appcollab-blue-dark">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send App Feedback
                    </Button>
                </div>
            </div>
        </div>
    )
}

function HelpSection({
    id,
    title,
    icon,
    children,
    isOpen,
    onToggle
}: {
    id: string
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    isOpen: boolean
    onToggle: () => void
}) {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-200">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}
