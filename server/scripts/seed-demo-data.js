import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config.js';
import { BloodInventory, BloodRequest, Donation, Donor, Hospital, Recipient, User, bloodGroups } from '../src/models.js';

const hospitalData = [
  ['City Care Hospital', 'New Delhi', 'Dr. Aditi Sharma', 'Emergency Medicine'],
  ['Apollo Community Hospital', 'Mumbai', 'Dr. Rahul Mehta', 'Cardiology'],
  ['LifeLine Medical Centre', 'Bengaluru', 'Dr. Priya Nair', 'General Medicine'],
  ['Hope Multispeciality Hospital', 'Pune', 'Dr. Arjun Rao', 'Trauma Care'],
  ['Sunrise Hospital', 'Jaipur', 'Dr. Neha Gupta', 'Paediatrics'],
  ['Metro Health Institute', 'Hyderabad', 'Dr. Karan Singh', 'Oncology'],
  ['Green Valley Hospital', 'Chandigarh', 'Dr. Simran Kaur', 'Surgery'],
  ['Unity Medical College', 'Lucknow', 'Dr. Vivek Verma', 'Haematology'],
  ['Sanjeevani Super Speciality', 'Ahmedabad', 'Dr. Ritu Patel', 'Critical Care'],
  ['National Heart and Blood Centre', 'Kolkata', 'Dr. Anirban Das', 'Cardiology'],
  ['Lotus Women and Children Hospital', 'Chennai', 'Dr. Lakshmi Iyer', 'Obstetrics'],
  ['Medistar Trauma Centre', 'Indore', 'Dr. Manish Jain', 'Trauma Care'],
  ['Riverfront General Hospital', 'Surat', 'Dr. Pooja Desai', 'General Medicine'],
  ['North Point Medical Centre', 'Dehradun', 'Dr. Mohit Rawat', 'Emergency Medicine'],
  ['Coastal Care Hospital', 'Kochi', 'Dr. Anjali Menon', 'Nephrology'],
  ['Heritage Multispeciality Hospital', 'Varanasi', 'Dr. Amit Mishra', 'Internal Medicine'],
  ['Central City Hospital', 'Nagpur', 'Dr. Sneha Kulkarni', 'Surgery'],
  ['Aarogya Blood and Cancer Institute', 'Bhopal', 'Dr. Sameer Khan', 'Oncology'],
  ['Blue Cross Medical Centre', 'Noida', 'Dr. Shreya Kapoor', 'Haematology'],
  ['PrimeCare Hospital', 'Gurugram', 'Dr. Rohan Malhotra', 'Critical Care'],
  ['Eastern Regional Hospital', 'Bhubaneswar', 'Dr. Ipsita Mohanty', 'Paediatrics'],
  ['Royal City Medical Institute', 'Mysuru', 'Dr. Karthik Shetty', 'Neurology'],
  ['Seven Hills Community Hospital', 'Patna', 'Dr. Nidhi Sinha', 'General Medicine'],
  ['Horizon Healthcare Centre', 'Ranchi', 'Dr. Aditya Prasad', 'Pulmonology'],
  ['Shanti Memorial Hospital', 'Amritsar', 'Dr. Harleen Gill', 'Emergency Medicine'],
  ['Wellness Multispeciality Centre', 'Coimbatore', 'Dr. Suresh Kumar', 'Orthopaedics'],
  ['Jeevan Jyoti Hospital', 'Nashik', 'Dr. Kavita Joshi', 'Cardiology'],
  ['Assam Valley Medical Centre', 'Guwahati', 'Dr. Bikash Deka', 'Internal Medicine'],
  ['Lakeview Hospital', 'Udaipur', 'Dr. Tanvi Rathore', 'Obstetrics'],
  ['Kaveri Institute of Medical Sciences', 'Mangaluru', 'Dr. Deepak Pai', 'Nephrology'],
  ['Capital Emergency Hospital', 'Raipur', 'Dr. Sonal Agrawal', 'Emergency Medicine'],
  ['Galaxy Children Hospital', 'Rajkot', 'Dr. Hiral Shah', 'Paediatrics']
];

const firstNames = ['Aarav','Aditi','Akash','Ananya','Arjun','Diya','Ishaan','Kavya','Krishna','Meera','Neha','Nikhil','Priya','Rahul','Riya','Rohan','Saanvi','Sahil','Simran','Vivek'];
const cities = ['Delhi','Mumbai','Bengaluru','Pune','Jaipur','Hyderabad','Chandigarh','Lucknow'];
const daysAgo = days => new Date(Date.now() - days * 86400000);

try {
  await mongoose.connect(config.mongoUri);
  const password = await bcrypt.hash('Demo@123', 10);

  const hospitals = [];
  for (let index = 0; index < hospitalData.length; index += 1) {
    const [name, city, mainDoctor, mainDomain] = hospitalData[index];
    hospitals.push(await Hospital.findOneAndUpdate({ name }, { name, address: `${10 + index}, Health Avenue, ${city}`, mainDoctor, mainDomain, contactNumber: `98765010${String(index).padStart(2, '0')}`, email: `care${index + 1}@bloodbank.demo` }, { upsert: true, new: true, runValidators: true }));
  }

  const donors = [];
  for (let index = 1; index <= 160; index += 1) {
    const username = `donor${String(index).padStart(3, '0')}`;
    const user = await User.findOneAndUpdate({ username }, { username, email: `${username}@bloodbank.demo`, password, userType: 'donor', phoneNumber: `90010${String(index).padStart(5, '0')}`, address: `${cities[index % cities.length]}, India` }, { upsert: true, new: true, runValidators: true });
    donors.push(await Donor.findOneAndUpdate({ user: user._id }, { user: user._id, bloodGroup: bloodGroups[index % bloodGroups.length], lastDonationDate: daysAgo(70 + (index % 120)), medicalCheckupDate: daysAgo(index % 45), isEligible: index % 10 !== 0 }, { upsert: true, new: true, runValidators: true }));
  }

  const recipients = [];
  for (let index = 1; index <= 120; index += 1) {
    const username = `recipient${String(index).padStart(3, '0')}`;
    const user = await User.findOneAndUpdate({ username }, { username, email: `${username}@bloodbank.demo`, password, userType: 'recipient', phoneNumber: `90120${String(index).padStart(5, '0')}`, address: `${cities[index % cities.length]}, India` }, { upsert: true, new: true, runValidators: true });
    recipients.push(await Recipient.findOneAndUpdate({ user: user._id }, { user: user._id, bloodGroup: bloodGroups[(index * 3) % bloodGroups.length], hospital: hospitals[index % hospitals.length]._id, unitsRequired: (index % 4) + 1, urgencyLevel: ['high', 'medium', 'low'][index % 3] }, { upsert: true, new: true, runValidators: true }));
  }

  for (let index = 0; index < recipients.length; index += 1) {
    await BloodRequest.findOneAndUpdate({ recipient: recipients[index]._id }, { recipient: recipients[index]._id, status: ['pending', 'approved', 'rejected', 'completed'][index % 4], createdAt: daysAgo(index % 30) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  for (let index = 0; index < bloodGroups.length; index += 1) {
    await BloodInventory.findOneAndUpdate({ bloodGroup: bloodGroups[index] }, { bloodGroup: bloodGroups[index], unitsAvailable: 30 + index * 5 }, { upsert: true, new: true });
  }

  for (let index = 0; index < 80; index += 1) {
    const donor = donors[index];
    await Donation.findOneAndUpdate({ donor: donor._id, donatedAt: daysAgo(index + 1) }, { donor: donor._id, name: firstNames[index % firstNames.length], bloodGroup: donor.bloodGroup, medicalCheckupDate: donor.medicalCheckupDate, donatedAt: daysAgo(index + 1) }, { upsert: true });
  }

  console.log(`Demo data ready: 160 donors, 120 recipients, ${hospitals.length} hospitals, 120 requests, 80 donations, and inventory for 8 blood groups.`);
} catch (error) {
  console.error(`Unable to seed demo data: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
