import { Link } from "wouter";

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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
            <Link href="/" className="text-primary font-medium">Dashboard</Link>
            <Link href="/prescriptions" className="text-slate-600 hover:text-slate-900">Prescriptions</Link>
            <Link href="/chat" className="text-slate-600 hover:text-slate-900">Chat Assistant</Link>
            <Link href="/analytics" className="text-slate-600 hover:text-slate-900">Analytics</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <i className="fas fa-bell text-lg"></i>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-700">JD</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Dr. John Davis</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
