import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Profile from "@/pages/Profile";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { PanelLeft } from "lucide-react";

function getInitials(name: string) {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'P';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const [location] = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientName, setPatientName] = useState('Patient');
  const [patientInitials, setPatientInitials] = useState('PT');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    function updateName() {
      const savedData = localStorage.getItem('profileData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const name = parsed?.personal?.fullName || 'Patient';
          setPatientName(name);
          setPatientInitials(getInitials(name));
        } catch {
          setPatientName('Patient');
          setPatientInitials('PT');
        }
      } else {
        setPatientName('Patient');
        setPatientInitials('PT');
      }
    }
    updateName();
    window.addEventListener('storage', updateName);
    return () => window.removeEventListener('storage', updateName);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg focus:outline-none mr-2"
                aria-label="Open navigation menu"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <PanelLeft size={28} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 max-w-full">
              <nav className="h-full flex flex-col">
                <div className="px-6 py-4 border-b">
                  <span className="text-lg font-bold text-primary">Navigation</span>
                </div>
                <ul className="flex-1 px-4 py-6 space-y-2">
                  <li>
                    <Link href="/timeline" onClick={() => setNavOpen(false)} className="block py-2 px-3 rounded hover:bg-primary/10 font-medium text-slate-800">Timeline</Link>
                  </li>
                  <li>
                    <Link href="/schedule" onClick={() => setNavOpen(false)} className="block py-2 px-3 rounded hover:bg-primary/10 font-medium text-slate-800">Schedule</Link>
                  </li>
                  <li>
                    <Link href="/medications" onClick={() => setNavOpen(false)} className="block py-2 px-3 rounded hover:bg-primary/10 font-medium text-slate-800">Medications</Link>
                  </li>
                  <li>
                    <Link href="/follow-ups" onClick={() => setNavOpen(false)} className="block py-2 px-3 rounded hover:bg-primary/10 font-medium text-slate-800">Follow-ups</Link>
                  </li>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-stethoscope text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MedGenie 2.0</h1>
                <p className="text-xs text-slate-500">AI-Powered Prescription Management</p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={location === '/' ? 'text-primary font-medium' : 'text-slate-600 hover:text-slate-900'}>Dashboard</Link>
            <Link href="/prescriptions" className={location === '/prescriptions' ? 'text-primary font-medium' : 'text-slate-600 hover:text-slate-900'}>Prescriptions</Link>
            <Link href="/timeline" className={location === '/timeline' ? 'text-primary font-medium' : 'text-slate-600 hover:text-slate-900'}>Timeline</Link>
            <Link href="/chat" className={location === '/chat' ? 'text-primary font-medium' : 'text-slate-600 hover:text-slate-900'}>Chat Assistant</Link>
            <Link href="/analytics" className={location === '/analytics' ? 'text-primary font-medium' : 'text-slate-600 hover:text-slate-900'}>Analytics</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-3">
              <button
                className="focus:outline-none"
                aria-label="Open profile"
                onClick={() => setProfileOpen(true)}
              >
                <Avatar className="w-8 h-8">
                  {/* Optionally load from localStorage or fallback */}
                  <AvatarImage src={typeof window !== 'undefined' ? localStorage.getItem('profilePhoto') || undefined : undefined} alt="Profile" />
                  <AvatarFallback>{patientInitials}</AvatarFallback>
                </Avatar>
              </button>
              <span className="text-sm font-medium text-slate-700 hidden sm:inline" title={patientName}>{patientName}</span>
            </div>
          </div>
        </div>
      </div>
      <Profile open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
