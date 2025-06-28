import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Calendar, Mail, MapPin, Phone, Plus, Save, Trash2, User, Pencil, PhoneCall } from 'lucide-react';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

interface ProfileData {
  personal: {
    fullName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    address: string;
  };
  medical: {
    bloodType: string;
    height: string;
    weight: string;
    allergies: string;
    primaryPhysician: string;
  };
  emergencyContacts: EmergencyContact[];
  healthMetrics: {
    bloodPressure: string;
    heartRate: string;
    bloodGlucose: string;
    lastUpdated: {
      bloodPressure: string;
      heartRate: string;
      bloodGlucose: string;
    };
  };
}

const defaultProfileData: ProfileData = {
  personal: {
    fullName: 'Jordan Smith',
    dateOfBirth: 'January 15, 1991',
    email: 'jordan.smith@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Health St, Medical City, CA 90210',
  },
  medical: {
    bloodType: 'A+',
    height: '5\'10" (178 cm)',
    weight: '165 lbs (75 kg)',
    allergies: 'Penicillin, Peanuts',
    primaryPhysician: 'Dr. Emily Johnson',
  },
  emergencyContacts: [
    {
      id: 1,
      name: 'Sarah Smith',
      phone: '+1 (555) 987-6543',
      email: 'sarah.smith@example.com',
      relationship: 'Spouse',
    }
  ],
  healthMetrics: {
    bloodPressure: '120/80 mmHg',
    heartRate: '72 bpm',
    bloodGlucose: '110 mg/dL',
    lastUpdated: {
      bloodPressure: 'May 10, 2025',
      heartRate: 'May 10, 2025',
      bloodGlucose: 'May 9, 2025',
    }
  }
};

const Profile = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  const [editedData, setEditedData] = useState<ProfileData>(defaultProfileData);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('profileData');
    if (savedData) {
      setProfileData(JSON.parse(savedData));
      setEditedData(JSON.parse(savedData));
    }
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) setPhotoUrl(savedPhoto);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData({ ...editedData });
    setIsEditing(false);
    localStorage.setItem('profileData', JSON.stringify(editedData));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...profileData });
  };

  const handleInputChange = (section: keyof ProfileData, field: string, value: string) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [field]: value
      }
    });
  };

  const handleContactChange = (id: number, field: string, value: string) => {
    setEditedData({
      ...editedData,
      emergencyContacts: editedData.emergencyContacts.map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    });
  };

  const addEmergencyContact = () => {
    if (editedData.emergencyContacts.length < 4) {
      const newContact: EmergencyContact = {
        id: Date.now(),
        name: '',
        phone: '',
        email: '',
        relationship: '',
      };
      setEditedData({
        ...editedData,
        emergencyContacts: [...editedData.emergencyContacts, newContact]
      });
    }
  };

  const removeEmergencyContact = (id: number) => {
    setEditedData({
      ...editedData,
      emergencyContacts: editedData.emergencyContacts.filter(contact => contact.id !== id)
    });
    setShowDeleteConfirm(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        localStorage.setItem('profilePhoto', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmergencyCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const renderField = (label: string, value: string, icon: JSX.Element, section: keyof ProfileData, field: string) => {
    if (isEditing && section !== 'healthMetrics') {
      return (
        <div className="mb-4">
          <label className="text-sm text-slate-500 block mb-1 flex items-center gap-2">{icon}{label}</label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={editedData[section][field as keyof typeof editedData[typeof section]]}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
          />
        </div>
      );
    }
    return (
      <div className="mb-4">
        <div className="text-sm text-slate-500 flex items-center gap-2">{icon}{label}</div>
        <div>{value}</div>
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg mx-auto w-full rounded-t-2xl p-0 h-full">
        <DrawerHeader>
          <DrawerTitle>Profile</DrawerTitle>
          <DrawerClose asChild>
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">×</button>
          </DrawerClose>
        </DrawerHeader>
        <div className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              {photoUrl ? <AvatarImage src={photoUrl} alt="Profile" /> : null}
              <AvatarFallback>{profileData.personal.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="text-xs text-primary cursor-pointer">
                Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
            <div className="text-lg font-bold">{profileData.personal.fullName}</div>
            <div className="text-xs text-slate-500">Patient ID: #1</div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-base">Personal Information</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
                  <Button variant="default" size="sm" onClick={handleSave}>
                    <Save size={14} className="mr-1" />Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleEdit}>Edit</Button>
              )}
            </div>
            {renderField('Full Name', profileData.personal.fullName, <User size={18} />, 'personal', 'fullName')}
            {renderField('Date of Birth', profileData.personal.dateOfBirth, <Calendar size={18} />, 'personal', 'dateOfBirth')}
            {renderField('Email', profileData.personal.email, <Mail size={18} />, 'personal', 'email')}
            {renderField('Phone', profileData.personal.phone, <Phone size={18} />, 'personal', 'phone')}
            {renderField('Address', profileData.personal.address, <MapPin size={18} />, 'personal', 'address')}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h2 className="font-medium text-base mb-2">Medical Information</h2>
            {renderField('Blood Type', profileData.medical.bloodType, <span className="text-red-500">🩸</span>, 'medical', 'bloodType')}
            {renderField('Height', profileData.medical.height, <span>📏</span>, 'medical', 'height')}
            {renderField('Weight', profileData.medical.weight, <span>⚖️</span>, 'medical', 'weight')}
            {renderField('Allergies', profileData.medical.allergies, <span>⚠️</span>, 'medical', 'allergies')}
            {renderField('Primary Physician', profileData.medical.primaryPhysician, <span>👨‍⚕️</span>, 'medical', 'primaryPhysician')}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-base">Emergency Contacts</h2>
              {isEditing && (
                <Button variant="default" size="sm" onClick={addEmergencyContact} disabled={editedData.emergencyContacts.length >= 4}>
                  <Plus size={14} className="mr-1" />Add Contact
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isEditing ? editedData.emergencyContacts : profileData.emergencyContacts).map(contact => (
                <div key={contact.id} className="bg-white rounded p-4 flex flex-col gap-2 border border-slate-100 relative min-w-0">
                  {isEditing ? (
                    <>
                      <input type="text" className="input input-bordered w-full" placeholder="Name" value={contact.name} onChange={e => handleContactChange(contact.id, 'name', e.target.value)} />
                      <select className="input input-bordered w-full" value={contact.relationship} onChange={e => handleContactChange(contact.id, 'relationship', e.target.value)} required>
                        <option value="">Select relationship</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Caregiver">Caregiver</option>
                        <option value="Doctor">Doctor</option>
                        <option value="Other">Other</option>
                      </select>
                      <input type="tel" className="input input-bordered w-full" placeholder="Phone" value={contact.phone} onChange={e => handleContactChange(contact.id, 'phone', e.target.value)} pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" title="Phone format: 123-456-7890" required />
                      <input type="email" className="input input-bordered w-full" placeholder="Email" value={contact.email} onChange={e => handleContactChange(contact.id, 'email', e.target.value)} />
                      <Button variant="destructive" size="icon" onClick={() => setShowDeleteConfirm(contact.id)}><Trash2 size={16} /></Button>
                    </>
                  ) : (
                    <>
                      <div className="font-medium truncate">{contact.name}</div>
                      <div className="text-xs text-slate-500 truncate">{contact.relationship}</div>
                      <div className="text-xs flex items-center truncate"><Phone size={14} className="mr-1 text-gray-500" />{contact.phone}</div>
                      <div className="text-xs flex items-center truncate"><Mail size={14} className="mr-1 text-gray-500" />{contact.email}</div>
                      <button onClick={() => handleEmergencyCall(contact.phone)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors mt-2 w-fit" aria-label="Emergency call"><PhoneCall size={16} /></button>
                    </>
                  )}
                  {showDeleteConfirm === contact.id && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-4">
                        <div className="mb-2 font-bold">Delete Contact?</div>
                        <div className="mb-4 text-sm">Are you sure you want to delete this contact?</div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={() => removeEmergencyContact(contact.id)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && editedData.emergencyContacts.length === 0 && (
                <div className="text-center text-xs text-slate-400 col-span-full">No emergency contacts added yet.</div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h2 className="font-medium text-base mb-2">Recent Health Metrics</h2>
            <div className="mb-2 flex justify-between">
              <span className="text-xs text-slate-500">Blood Pressure</span>
              <span className="text-xs text-slate-400">Last updated: {profileData.healthMetrics.lastUpdated.bloodPressure}</span>
            </div>
            <div className="text-base font-medium mb-2">{profileData.healthMetrics.bloodPressure}</div>
            <div className="mb-2 flex justify-between">
              <span className="text-xs text-slate-500">Heart Rate</span>
              <span className="text-xs text-slate-400">Last updated: {profileData.healthMetrics.lastUpdated.heartRate}</span>
            </div>
            <div className="text-base font-medium mb-2">{profileData.healthMetrics.heartRate}</div>
            <div className="mb-2 flex justify-between">
              <span className="text-xs text-slate-500">Blood Glucose</span>
              <span className="text-xs text-slate-400">Last updated: {profileData.healthMetrics.lastUpdated.bloodGlucose}</span>
            </div>
            <div className="text-base font-medium">{profileData.healthMetrics.bloodGlucose}</div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default Profile; 