import { redirect } from 'next/navigation';

export default function WebsiteSettingsRedirect() {
    redirect('/dashboard/website-settings/dates');
}
