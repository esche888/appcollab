import * as React from 'react'
import { Html, Head, Body, Container, Section, Text, Link, Hr } from '@react-email/components'

interface FeatureSuggestionCreatedProps {
  ownerName: string
  projectTitle: string
  suggestionTitle: string
  suggestionPreview: string
  userName: string
  projectUrl: string
}

export default function FeatureSuggestionCreated({
  ownerName = 'Project Owner',
  projectTitle = 'Your Project',
  suggestionTitle = 'New Feature Suggestion',
  suggestionPreview = '',
  userName = 'A user',
  projectUrl = 'https://appcollab.com',
}: FeatureSuggestionCreatedProps) {
  const settingsUrl = projectUrl.split('/projects/')[0] || 'https://appcollab.com'

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={heading}>New Feature Suggestion</Text>

            <Text style={text}>Hi {ownerName},</Text>

            <Text style={text}>
              {userName} just submitted a new feature suggestion for your project <strong>{projectTitle}</strong>.
            </Text>

            <Section style={suggestionBox}>
              <Text style={suggestionTitleStyle}>{suggestionTitle}</Text>
              <Text style={suggestionPreviewStyle}>{suggestionPreview}</Text>
            </Section>

            <Link href={projectUrl} style={button}>
              View Suggestion
            </Link>

            <Hr style={hr} />

            <Text style={footer}>
              You&apos;re receiving this email because you&apos;re an owner of {projectTitle} on AppCollab.
              <br />
              <Link href={settingsUrl} style={footerLink}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const section = {
  padding: '0 48px',
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '24px',
  color: '#1a1a1a',
}

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a5568',
}

const suggestionBox = {
  backgroundColor: '#f7fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '16px',
  margin: '24px 0',
}

const suggestionTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#2d3748',
  margin: '0 0 8px 0',
}

const suggestionPreviewStyle = {
  fontSize: '14px',
  color: '#4a5568',
  margin: '0',
  lineHeight: '22px',
}

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '24px 0',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
}

const footer = {
  fontSize: '12px',
  color: '#718096',
  lineHeight: '20px',
}

const footerLink = {
  color: '#0070f3',
  textDecoration: 'underline',
}
