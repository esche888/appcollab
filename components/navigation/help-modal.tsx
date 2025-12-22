'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Users, Lightbulb, Search, MessageSquare, Award, User, Target, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export function HelpModal() {
    const [openSection, setOpenSection] = useState<string | null>('introduction')

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Help">
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-appcollab-teal-dark to-appcollab-blue-dark bg-clip-text text-transparent">
                        How to Use AppCollab
                    </DialogTitle>
                    <DialogDescription>
                        A guide for technical and non-technical users alike.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-600 mb-6">
                        Welcome! AppCollab is a community space where ideas come to life.
                        Whether you have a brilliant concept or want to help build someone else's, this guide will get you started.
                    </p>

                    <div className="space-y-4">
                        {/* Introduction Section */}
                        <HelpSection
                            id="introduction"
                            title="What is AppCollab?"
                            icon={<BookOpen className="h-5 w-5 text-appcollab-blue" />}
                            isOpen={openSection === 'introduction'}
                            onToggle={() => toggleSection('introduction')}
                        >
                            <p className="mb-3 text-sm">
                                AppCollab connects people with <strong>Ideas</strong> to people with <strong>Skills</strong>.
                                It bridges the gap between visionaries (designers, marketers, etc.) and developers.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                <li><strong>For Visionaries:</strong> Post ideas, describe gaps, find contributors.</li>
                                <li><strong>For Contributors:</strong> Browse projects, fill gaps, build portfolio.</li>
                            </ul>
                        </HelpSection>

                        {/* Projects Section */}
                        <HelpSection
                            id="projects"
                            title="Navigating Projects"
                            icon={<Target className="h-5 w-5 text-appcollab-teal" />}
                            isOpen={openSection === 'projects'}
                            onToggle={() => toggleSection('projects')}
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Finding a Project</h3>
                            <p className="mb-3 text-sm">
                                The <strong>Projects</strong> page is your dashboard for active ideas.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mb-4">
                                <li><strong>Filters:</strong> Filter by Status or Owner.</li>
                                <li><strong>Reset:</strong> Use "Reset Filters" to clear selections.</li>
                                <li><strong>Favorites:</strong> Save interesting projects.</li>
                            </ul>

                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Creating a Project</h3>
                            <p className="mb-2 text-sm">
                                Click <strong>New Project</strong> to start. Key fields:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                <li><strong>Title & Description:</strong> Clear and catchy.</li>
                                <li><strong>Status:</strong> Typically starts as "Idea".</li>
                            </ul>
                        </HelpSection>

                        {/* Gaps Section */}
                        <HelpSection
                            id="gaps"
                            title="Understanding 'Help Needed' (Gaps)"
                            icon={<Users className="h-5 w-5 text-appcollab-orange" />}
                            isOpen={openSection === 'gaps'}
                            onToggle={() => toggleSection('gaps')}
                        >
                            <div className="bg-orange-50 border-l-4 border-orange-400 p-2 mb-3">
                                <p className="text-orange-800 text-xs font-medium">
                                    Core Concept: Gaps are roles that need filling.
                                </p>
                            </div>
                            <p className="mb-3 text-sm">
                                When viewing project details, look for the <strong>Help Needed</strong> section.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mb-3">
                                <li><strong>Examples:</strong> UX Design, Development, Marketing.</li>
                            </ul>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">How to Help</h3>
                            <p className="text-sm">
                                Click <strong>Tag Yourself</strong> on a Gap card to signal interest.
                            </p>
                        </HelpSection>

                        {/* Feature Suggestions Section */}
                        <HelpSection
                            id="suggestions"
                            title="Feature Suggestions & Voting"
                            icon={<Lightbulb className="h-5 w-5 text-appcollab-green-light" />}
                            isOpen={openSection === 'suggestions'}
                            onToggle={() => toggleSection('suggestions')}
                        >
                            <p className="mb-3 text-sm">
                                Shape projects even if you don't code:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                <li><strong>Suggest Features:</strong> Propose ideas on the project page.</li>
                                <li><strong>Vote:</strong> Upvote suggestions to help owners prioritize.</li>
                            </ul>
                        </HelpSection>

                        {/* Best Practices Section */}
                        <HelpSection
                            id="best-practices"
                            title="Best Practices"
                            icon={<Award className="h-5 w-5 text-purple-600" />}
                            isOpen={openSection === 'best-practices'}
                            onToggle={() => toggleSection('best-practices')}
                        >
                            <p className="mb-3 text-sm">
                                A library of shared wisdom on Design, Security, and more.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                <li><strong>Read:</strong> Learn from community guides.</li>
                                <li><strong>Request:</strong> Ask for topics you need.</li>
                            </ul>
                        </HelpSection>

                        {/* Profile Section */}
                        <HelpSection
                            id="profile"
                            title="Your Profile"
                            icon={<User className="h-5 w-5 text-gray-600" />}
                            isOpen={openSection === 'profile'}
                            onToggle={() => toggleSection('profile')}
                        >
                            <p className="mb-3 text-sm">
                                Your digital resume on AppCollab.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                                <li><strong>Bio:</strong> Introduce yourself.</li>
                                <li><strong>Skills:</strong> List capabilities so owners can find you.</li>
                                <li><strong>Contributions:</strong> Tracks your project activity.</li>
                            </ul>
                        </HelpSection>

                        <div className="mt-6 text-center pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-3">
                                Feedback? Let us know on any project page!
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-50 rounded-md">
                        {icon}
                    </div>
                    <h2 className="text-base font-semibold text-gray-800">{title}</h2>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="prose prose-sm max-w-none text-gray-600">
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}
