import { ContributorViewer } from '@/components/contributors/contributor-viewer'

export const metadata = {
    title: 'Contributors | AppCollab',
    description: 'Browse and discover contributors in the AppCollab community',
}

export default function ContributorsPage() {
    return (
        <div className="p-8 min-h-screen bg-gradient-to-br from-appcollab-orange/10 via-orange-50 to-amber-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    {/* Header content moved to ContributorViewer or styled there, 
                       but for now just keeping the wrapper similar to Projects page */}
                </div>
                <ContributorViewer />
            </div>
        </div>
    )
}
