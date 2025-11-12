export interface TruckProfile {
  id: string;
  companyName: string;
  make: string;
  model: string;
  year: string;
  truckNumber: string;
  tripNumber: string;
  driverId: string;
  mcn: string;
  dotNumber: string;
  registrationNumber: string;
  mileage: string;
  heightWithTrailer: string;
  heightWithoutTrailer: string;
  width: string;
  length: string;
  trailerType: string;
  trailerLength: string;
  trailerWidth: string;
  trailerHeight: string;
  trailerNumber: string;
  trailerYear: string;
  trailerRegistrationPlate: string;
  trailerInsurance: string;
  trailerInspection: string;
  maxLoadWeight: string;
  steerAxleWeight: string;
  driveAxleWeight: string;
  trailerAxleWeight: string;
  grossVehicleWeight: string;
  steerTirePSI: string;
  driveTirePSI: string;
  trailerTirePSI: string;
  steerTireSize: string;
  driveTireSize: string;
  trailerTireSize: string;
  steeringTreadDepth: string;
  driverTreadDepth: string;
  trailerTreadDepth: string;
  puNumber: string;
  bol: string;
  loadWeight: string;
  freight: string;
}

export interface Place {
  id: string;
  companyName: string;
  userName?: string;
  city: string;
  state: string;
  address: string;
  contactNumber: string;
  dispatchInfo: string;
  category?: string;
  hasRestroom: boolean;
  parkingAvailability: 'yes' | 'no' | 'limited';
  overnightParking: boolean;
  notes: string;
  photos: string[];
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  uri: string;
  category: 'truck' | 'scenic' | 'location' | 'maintenance' | 'other';
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface Trailer {
  id: string;
  trailerNumber: string;
  trailerType: string;
  make: string;
  model: string;
  year: string;
  length: string;
  width: string;
  height: string;
  maxLoadWeight: string;
  axleWeight: string;
  tirePSI: string;
  tireSize: string;
  registrationNumber: string;
  inspectionDate: string;
  notes: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  companyName: string;
  name: string;
  position: string;
  phoneNumber: string;
  notes: string;
  photoUri?: string;
  displayPhotoId?: string;
  createdAt: string;
}

export interface HealthInsurance {
  id: string;
  providerName: string;
  groupNumber: string;
  idNumber: string;
  driverName: string;
  frontCardUri?: string;
  backCardUri?: string;
  createdAt: string;
}

export interface DriverID {
  id: string;
  name: string;
  driverIdNumber: string;
  state: string;
  frontCardUri?: string;
  backCardUri?: string;
  createdAt: string;
}

export interface FileDocument {
  id: string;
  fileName?: string;
  tripNumber?: string;
  displayField?: 'fileName' | 'tripNumber';
  scanImages: string[];
  pdfUri?: string;
  createdAt: string;
}
