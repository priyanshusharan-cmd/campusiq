import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme, colorFromString } from '@/theme';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSubjectStore, useProfileStore, useTimetableStore } from '@/stores';
import { getSubjectTheme } from '@/utils/subjectTheme';

// The data
const data = [
  {
    college: 'BMSCE',
    branches: [
      {
        branch: 'Computer Science & Engineering',
        aliases: ['cse', 'cs', 'computer science'],
        semesters: [
          {
            name: 'First Year – Physics Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25PH1BSPCS', name: 'Quantum Physics and Computation for Computer Science Engineering Stream', credits: 4 },
              { code: '25ME1ESCED', name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { code: '25CS1ESEIT', name: 'Essentials of Information Technology', credits: 3 },
              { code: '25CS1PSSPC', name: 'Structured Programming in C', credits: 4 },
              { code: '25MA1HSSSK', name: 'Soft Skills (Balake/Samskrutika Kannada)', credits: 1 },
              { code: '25ME1AEIDT', name: 'Innovation and Design Thinking', credits: 1 },
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25CY1BSCCS', name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { code: '25CS1ETIAA', name: 'Introduction to AI Applications', credits: 3 },
              { code: '25CS1ESICP', name: 'Introduction to C Program', credits: 3 },
              { code: '25CS1ESIPP', name: 'Introduction to Python Programming', credits: 4 },
              { code: '25MA1AECEN', name: 'Communication Skills', credits: 1 },
              { code: '25MA1HSICE', name: 'Indian Constitution & Engineering Ethics', credits: 1 },
              { code: '25ME1AEIDL', name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { code: '23MA3BSSDM', name: 'Statistics and Discrete Mathematics', credits: 3 },
              { code: '23CS3ESCOA', name: 'Computer Organization and Architecture', credits: 3 },
              { code: '23CS3PCOOJ', name: 'Object Oriented Java Programming', credits: 4 },
              { code: '23CS3PCLOD', name: 'Logic Design', credits: 2 },
              { code: '23CS3PCDBM', name: 'Database Management Systems', credits: 4 },
              { code: '23CS3PCCGL', name: 'Computer Graphics Laboratory', credits: 2 },
              { code: '23CS3AECES', name: 'Environmental Studies', credits: 1 },
              { code: '23NCMC3NS1', name: 'AICTE Activity Point Course (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { code: '23MA4BSLAL', name: 'Linear Algebra', credits: 3 },
              { code: '23CS4ESCRP', name: 'Cryptography', credits: 3 },
              { code: '23CS4PCOPS', name: 'Operating Systems', credits: 4 },
              { code: '23CS4PCADA', name: 'Analysis and Design of Algorithms', credits: 4 },
              { code: '23CS4PCCGP', name: 'Computer Graphics', credits: 3 },
              { code: '23CS4AEUHV', name: 'Universal Human Values', credits: 1 },
              { code: '23CS4AEMAD', name: 'Mobile Application Development Laboratory', credits: 4 },
              { code: '23NCMC3NS2', name: 'AICTE Activity Point Course (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { code: '23CS5BSBIS', name: 'Bio Inspired Systems', credits: 1 },
              { code: '23CS5PCCND', name: 'Compiler Design', credits: 4 },
              { code: '23CS5PCFSD', name: 'Full Stack Development', credits: 4 },
              { code: '23CS5PCCGV', name: 'Computer Vision and Graphics', credits: 4 },
              { code: '23CS5PCDMD', name: 'Data Mining', credits: 4 },
              { code: '23CS5PEXXX', name: 'Professional Elective–I', credits: 3 },
              { code: '23MA5HSEMG', name: 'Engineering Management', credits: 1 },
              { code: '23CS5PWMP', name: 'Mini Project', credits: 2 },
              { code: '23NCMC3NS3', name: 'AICTE Activity Point Course (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { code: '23CS6PCCCT', name: 'Cloud Computing', credits: 3 },
              { code: '23CS6PCBDA', name: 'Big Data Analytics', credits: 4 },
              { code: '23CS6PCMAL', name: 'Machine Learning', credits: 4 },
              { code: '23CS6AERML', name: 'Research Methodology and IPR', credits: 3 },
              { code: '23CS6PEXXX', name: 'Professional Elective–II', credits: 3 },
              { code: '23CS6OEXXX', name: 'Open Elective–I', credits: 3 },
              { code: '23CS6PWPP1', name: 'Major Project Phase–I', credits: 2 },
              { code: '23NCMC3NS4', name: 'AICTE Activity Point Course (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { code: '23CS7PCNWP', name: 'Network Programming', credits: 3 },
              { code: '23CS7PCMNE', name: 'Management and Entrepreneurship', credits: 3 },
              { code: '23CS7PEXXX', name: 'Professional Elective–III', credits: 3 },
              { code: '23CS7OEXXX', name: 'Open Elective–II', credits: 3 },
              { code: '23CS7PWPP2', name: 'Major Project Phase–II', credits: 8 },
              { code: '25MA7HSIKL', name: 'Indian Knowledge Systems', credits: 1 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { code: '23CS8PEXXX', name: 'Professional Elective–IV', credits: 3 },
              { code: '23CS8OEXXX', name: 'Open Elective–III', credits: 3 },
              { code: '23CS8SRINT', name: 'Internship', credits: 6 }
            ]
          }
        ]
      },
      {
        branch: 'Mechanical Engineering',
        aliases: ['me', 'mech', 'mechanical'],
        semesters: [
          {
            name: 'First Year – Physics Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25PH1BSPCS', name: 'Quantum Physics and Computation for Computer Science Engineering Stream', credits: 4 },
              { code: '25ME1ESCED', name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { code: '25CS1ESEIT', name: 'Essentials of Information Technology', credits: 3 },
              { code: '25CS1PSSPC', name: 'Structured Programming in C', credits: 4 },
              { code: '25MA1HSSSK', name: 'Soft Skills (Balake/Samskrutika Kannada)', credits: 1 },
              { code: '25ME1AEIDT', name: 'Innovation and Design Thinking', credits: 1 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25CY1BSCCS', name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { code: '25CS1ETIAA', name: 'Introduction to AI Applications', credits: 3 },
              { code: '25CS1ESICP', name: 'Introduction to C Program', credits: 3 },
              { code: '25CS1ESIPP', name: 'Introduction to Python Programming', credits: 4 },
              { code: '25MA1AECEN', name: 'Communication Skills', credits: 1 },
              { code: '25MA1HSICE', name: 'Indian Constitution & Engineering Ethics', credits: 1 },
              { code: '25ME1AEIDL', name: 'IDEA Lab (Multidisciplinary)', credits: 1 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { code: '23MA3BSTFN', name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { code: '23ME3ESMSM', name: 'Materials Science and Metallurgy', credits: 3 },
              { code: '23ME3PCETD', name: 'Engineering Thermodynamics', credits: 4 },
              { code: '22ME3PCMAP', name: 'Manufacturing Processes', credits: 4 },
              { code: '23ME3PCSOM', name: 'Strength of Materials', credits: 4 },
              { code: '22ME3PCCMD', name: 'Computer Aided Machine Drawing', credits: 2 },
              { code: '23ME3BSBFE', name: 'Biology for Engineers', credits: 1 },
              { code: '23MA3AEMCL', name: 'Machine Learning for Mechanical Engineers', credits: 1 },
              { code: '23ME3NCNSS', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { code: '23MA4BSCPS', name: 'Complex Analysis, Probability and Statistical Methods', credits: 4 },
              { code: '23ME4ESORE', name: 'Operations Research', credits: 3 },
              { code: '23ME4PCFME', name: 'Fluid Mechanics', credits: 4 },
              { code: '23ME4PCMFT', name: 'Manufacturing Technology', credits: 3 },
              { code: '23ME4PCTOM', name: 'Theory of Machines', credits: 4 },
              { code: '23ME4PCDM1', name: 'Design of Machine Elements – I', credits: 3 },
              { code: '23ME4AEDTI', name: 'Digital Twin and Ideation', credits: 1 },
              { code: '23ME4AEUHV', name: 'Universal Human Values', credits: 1 },
              { code: '23ME4NCNSS', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { code: '23ME5PCDM2', name: 'Design of Machine Elements – II', credits: 4 },
              { code: '23ME5PCMMM', name: 'Mechanical Measurements and Metrology', credits: 4 },
              { code: '23ME5PCMEV', name: 'Mechanical Vibrations', credits: 3 },
              { code: '23ME5PCTFE', name: 'Thermal and Fluids Engineering', credits: 4 },
              { code: '23ME5PEXXX', name: 'Professional Elective – I', credits: 3 },
              { code: '23ME5PWMPW', name: 'Mini Project Work', credits: 2 },
              { code: '23ME5HSEVS', name: 'Environmental Studies', credits: 1 },
              { code: '23ME5AEREM', name: 'Research Methodology', credits: 2 },
              { code: '23ME5NCNSS', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { code: '23ME6PCMFE', name: 'Modelling and Finite Element Analysis', credits: 4 },
              { code: '23ME6PCAUR', name: 'Automation and Robotics', credits: 3 },
              { code: '23ME6PCHTR', name: 'Heat Transfer', credits: 4 },
              { code: '23ME6PCCOE', name: 'Control Engineering', credits: 3 },
              { code: '23ME6PEXXX', name: 'Professional Elective – II', credits: 3 },
              { code: '23ME6OEXXX', name: 'Open Elective – I', credits: 3 },
              { code: '23ME6PWMJ1', name: 'Project Work Phase – I', credits: 2 },
              { code: '23ME6NCNSS', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { code: '23ME7PCMCT', name: 'Mechatronics', credits: 3 },
              { code: '23ME7PLDES', name: 'Design Lab', credits: 1 },
              { code: '23ME7LAML', name: 'Advanced Manufacturing Lab', credits: 1 },
              { code: '23ME7PEXXX', name: 'Professional Elective – III', credits: 3 },
              { code: '23ME7OEXXX', name: 'Open Elective – II', credits: 3 },
              { code: '23ME7AEPMF', name: 'Project Management and Finance', credits: 2 },
              { code: '23ME7PWMJ2', name: 'Project Work Phase – II', credits: 7 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { code: '23ME8PEXXX', name: 'Professional Elective – IV', credits: 3 },
              { code: '23ME8OEXXX', name: 'Open Elective – III', credits: 3 },
              { code: '23ME8SRINT', name: 'Internship', credits: 6 }
            ]
          }
        ]
      },
      {
        branch: 'Electrical & Electronics Engineering',
        aliases: ['eee', 'ee', 'electrical', 'electronics'],
        semesters: [
          {
            name: 'First Year – Physics Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25PH1BSPCS', name: 'Quantum Physics and Computation for Computer Science Engineering Stream', credits: 4 },
              { code: '25ME1ESCED', name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { code: '25CS1ESEIT', name: 'Essentials of Information Technology', credits: 3 },
              { code: '25CS1PSSPC', name: 'Structured Programming in C', credits: 4 },
              { code: '25MA1HSSSK', name: 'Soft Skills (Balake/Samskrutika Kannada)', credits: 1 },
              { code: '25ME1AEIDT', name: 'Innovation and Design Thinking', credits: 1 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25CY1BSCCS', name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { code: '25CS1ETIAA', name: 'Introduction to AI Applications', credits: 3 },
              { code: '25CS1ESICP', name: 'Introduction to C Program', credits: 3 },
              { code: '25CS1ESIPP', name: 'Introduction to Python Programming', credits: 4 },
              { code: '25MA1AECEN', name: 'Communication Skills', credits: 1 },
              { code: '25MA1HSICE', name: 'Indian Constitution & Engineering Ethics', credits: 1 },
              { code: '25ME1AEIDL', name: 'IDEA Lab (Multidisciplinary)', credits: 1 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { code: '23MA3BSTFN', name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { code: '23EE3ESEFT', name: 'Electromagnetic Field Theory', credits: 3 },
              { code: '23ES3PCNAL', name: 'Network Analysis', credits: 4 },
              { code: '23EE3PCMNI', name: 'Measurements and Instrumentation', credits: 3 },
              { code: '23EE3PCTDC', name: 'Transformers and DC Machines', credits: 5 },
              { code: '23ES3PCDEC', name: 'Digital Electronic Circuits', credits: 5 },
              { code: '23ES3BSBFE', name: 'Biology for Engineers', credits: 1 },
              { code: '23EE3AECAM', name: 'Circuits and Measurements Lab', credits: 1 },
              { code: '23NCMC3NS1', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { code: '23EE4BSMAE', name: 'Mathematical Applications to Electrical Systems', credits: 2 },
              { code: '23EE4ESCTH', name: 'Control Theory', credits: 5 },
              { code: '23EE4PCISM', name: 'Induction Motors and Synchronous Machines', credits: 5 },
              { code: '23EE4PCGTD', name: 'Generation, Transmission and Distribution', credits: 3 },
              { code: '23ES4PCAPP', name: 'ARM Processor and Programming', credits: 5 },
              { code: '23EE4PCAEL', name: 'Analog Electronics and Linear Integrated Circuits', credits: 3 },
              { code: '23MA4AEUHV', name: 'Universal Human Values', credits: 1 },
              { code: '23EE4AEAPL', name: 'Analog Electronics and PCB Design Lab', credits: 1 },
              { code: '23NCMC4NS2', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { code: '23EE5PCXXX', name: 'Professional Core Course', credits: 0 },
              { code: '23EE5PEXXX', name: 'Professional Elective – I', credits: 3 },
              { code: '23EE5PWMPW', name: 'Mini Project Work', credits: 2 },
              { code: '23EE5HSXXX', name: 'Humanities / Management Course', credits: 1 },
              { code: '23EE5AEXXX', name: 'Ability Enhancement Course', credits: 2 },
              { code: '23NCMC5NS3', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { code: '23EE6PCXXX', name: 'Professional Core Course', credits: 0 },
              { code: '23EE6PEXXX', name: 'Professional Elective – II', credits: 3 },
              { code: '23EE6OEXXX', name: 'Open Elective – I', credits: 3 },
              { code: '23EE6PWMJ1', name: 'Project Work Phase – I', credits: 2 },
              { code: '23NCMC6NS4', name: 'NSS / Yoga / Physical Education (Non-Credit)', credits: 0 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { code: '23EE7PCXXX', name: 'Professional Core Course', credits: 7 },
              { code: '23EE7PEXXX', name: 'Professional Elective – III', credits: 3 },
              { code: '23EE7OEXXX', name: 'Open Elective – II', credits: 3 },
              { code: '23EE7PWMJ2', name: 'Project Work Phase – II', credits: 7 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { code: '23EE8PEXXX', name: 'Professional Elective – IV', credits: 3 },
              { code: '23EE8OEXXX', name: 'Open Elective – III', credits: 3 },
              { code: '23EE8SRINT', name: 'Internship', credits: 6 }
            ]
          }
        ]
      },
      {
        branch: 'Electronics and Communication Engineering',
        aliases: ['ece', 'ec', 'electronics', 'electronics and communication'],
        semesters: [
          {
            name: 'First Year – Physics Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25PH1BSPCS', name: 'Quantum Physics and Computation for Computer Science Engineering Stream', credits: 4 },
              { code: '25ME1ESCED', name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { code: '25CS1ESEIT', name: 'Essentials of Information Technology', credits: 3 },
              { code: '25CS1PSSPC', name: 'Structured Programming in C', credits: 4 },
              { code: '25MA1HSSSK', name: 'Soft Skills (Balake/Samskrutika Kannada)', credits: 1 },
              { code: '25ME1AEIDT', name: 'Innovation and Design Thinking', credits: 1 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25CY1BSCCS', name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { code: '25CS1ETIAA', name: 'Introduction to AI Applications', credits: 3 },
              { code: '25CS1ESICP', name: 'Introduction to C Program', credits: 3 },
              { code: '25CS1ESIPP', name: 'Introduction to Python Programming', credits: 4 },
              { code: '25MA1AECEN', name: 'Communication Skills', credits: 1 },
              { code: '25MA1HSICE', name: 'Indian Constitution & Engineering Ethics', credits: 1 },
              { code: '25ME1AEIDL', name: 'IDEA Lab (Multidisciplinary)', credits: 1 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { code: '23MA3BSTFN', name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { code: '23EC3PCXXX', name: 'Professional Core Course 1', credits: 0 },
              { code: '23EC3PCXXX', name: 'Professional Core Course 2', credits: 0 },
              { code: '23EC3PCXXX', name: 'Professional Core Course 3', credits: 0 },
              { code: '23EC3PCXXX', name: 'Professional Core Course 4', credits: 0 },
              { code: '23EC3BSXXX', name: 'Basic Science Course', credits: 1 },
              { code: '23EC3AEXXX', name: 'Ability Enhancement Course', credits: 1 },
              { code: '23NCMC3NS1', name: 'NSS – 1', credits: 0 },
              { code: '23NCMC3YG1', name: 'Yoga – 1', credits: 0 },
              { code: '23NCMC3PE1', name: 'Physical Education – 1', credits: 0 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { code: '23EC4BSXXX', name: 'Basic Science Course', credits: 0 },
              { code: '23EC4ESXXX', name: 'Engineering Science Course', credits: 0 },
              { code: '23EC4PCXXX', name: 'Professional Core Course 1', credits: 0 },
              { code: '23EC4PCXXX', name: 'Professional Core Course 2', credits: 0 },
              { code: '23EC4PCXXX', name: 'Professional Core Course 3', credits: 0 },
              { code: '23EC4PCXXX', name: 'Professional Core Course 4', credits: 0 },
              { code: '23MA4AEUHV', name: 'Universal Human Values', credits: 1 },
              { code: '23EC4AEXXX', name: 'Ability Enhancement Course', credits: 1 },
              { code: '23NCMC4NS2', name: 'NSS – 2', credits: 0 },
              { code: '23NCMC4YG2', name: 'Yoga – 2', credits: 0 },
              { code: '23NCMC4PE2', name: 'Physical Education – 2', credits: 0 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { code: '23EC5PCXXX', name: 'Professional Core Course 1', credits: 0 },
              { code: '23EC5PCXXX', name: 'Professional Core Course 2', credits: 0 },
              { code: '23EC5PE1XX', name: 'Professional Elective – I', credits: 3 },
              { code: '23EC5PWMPW', name: 'Mini Project Work', credits: 2 },
              { code: '23EC5HSXXX', name: 'Humanities / Management Course', credits: 1 },
              { code: '23EC5AEXXX', name: 'Ability Enhancement Course', credits: 1 },
              { code: '23NCMC5NS3', name: 'NSS – 3', credits: 0 },
              { code: '23NCMC5YG3', name: 'Yoga – 3', credits: 0 },
              { code: '23NCMC5PE3', name: 'Physical Education – 3', credits: 0 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { code: '23EC6PCXXX', name: 'Professional Core Course 1', credits: 0 },
              { code: '23EC6PCXXX', name: 'Professional Core Course 2', credits: 0 },
              { code: '23EC6PE2XX', name: 'Professional Elective – II', credits: 3 },
              { code: '23EC6OE1XX', name: 'Open Elective – I', credits: 3 },
              { code: '23EC6PWPJ1', name: 'Project Work – I', credits: 2 },
              { code: '23NCMC6NS4', name: 'NSS – 4', credits: 0 },
              { code: '23NCMC6YG4', name: 'Yoga – 4', credits: 0 },
              { code: '23NCMC6PE4', name: 'Physical Education – 4', credits: 0 },
              { code: '24NCMC6IM4', name: 'Indian Music – 4', credits: 0 },
              { code: '24NCMC6ID4', name: 'Indian Dance – 4', credits: 0 },
              { code: '24NCMC6TA4', name: 'Theatre Arts – 4', credits: 0 },
              { code: '24NCMC6WM4', name: 'Western Music – 4', credits: 0 },
              { code: '24NCMC6WD4', name: 'Western Dance – 4', credits: 0 },
              { code: '24NCMC6FA4', name: 'Fine Arts – 4', credits: 0 },
              { code: '24NCMC6MM4', name: 'Multimedia – 4', credits: 0 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { code: '23EC7PCESD', name: 'Embedded System Design', credits: 5 },
              { code: '23EC7PCECS', name: 'Electronics and Communication for Sustainable Development', credits: 2 },
              { code: '23EC7PE3XX', name: 'Professional Elective – III', credits: 3 },
              { code: '23EC7OE2XX', name: 'Open Elective – II', credits: 3 },
              { code: '23EC7PWPJ2', name: 'Project Work – II', credits: 7 },
              { code: '25MA7HSIKL', name: 'Indian Knowledge Systems', credits: 1 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { code: '23EC8PE4XX', name: 'Professional Elective – IV', credits: 3 },
              { code: '23EC8OE3XX', name: 'Open Elective – III', credits: 3 },
              { code: '23EC8SRINT', name: 'Internship', credits: 6 }
            ]
          }
        ]
      },
      {
        branch: 'Civil Engineering',
        aliases: ['civil', 'ce', 'civil engineering'],
        semesters: [
          {
            name: 'First Year – Physics Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25PH1BSPCS', name: 'Quantum Physics and Computation for Computer Science Engineering Stream', credits: 4 },
              { code: '25ME1ESCED', name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { code: '25CS1ESEIT', name: 'Essentials of Information Technology', credits: 3 },
              { code: '25CS1PSSPC', name: 'Structured Programming in C', credits: 4 },
              { code: '25MA1HSSSK', name: 'Soft Skills (Balake/Samskrutika Kannada)', credits: 1 },
              { code: '25ME1AEIDT', name: 'Innovation and Design Thinking', credits: 1 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { code: '25MA1BSMCS', name: 'Mathematical Foundation for Computer Science Stream – I', credits: 4 },
              { code: '25CY1BSCCS', name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { code: '25CS1ETIAA', name: 'Introduction to AI Applications', credits: 3 },
              { code: '25CS1ESICP', name: 'Introduction to C Program', credits: 3 },
              { code: '25CS1ESIPP', name: 'Introduction to Python Programming', credits: 4 },
              { code: '25MA1AECEN', name: 'Communication Skills', credits: 1 },
              { code: '25MA1HSICE', name: 'Indian Constitution & Engineering Ethics', credits: 1 },
              { code: '25ME1AEIDL', name: 'IDEA Lab (Multidisciplinary)', credits: 1 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { code: '23MA3BSMCV', name: 'Mathematics for Civil Engineering–3', credits: 4 },
              { code: '23CV3PCBMC', name: 'Building Materials and Construction', credits: 4 },
              { code: '23CV3ESENG', name: 'Engineering Geology', credits: 4 },
              { code: '23CV3PCFME', name: 'Fluid Mechanics', credits: 4 },
              { code: '23CV3PCGDY', name: 'Geodesy', credits: 6 },
              { code: '23CV3PCSOM', name: 'Strength of Materials', credits: 5 },
              { code: '23CV3BSBFE', name: 'Biology for Engineers', credits: 1 },
              { code: '23CV3AEIME', name: 'Introduction to MS Excel', credits: 1 },
              { code: '23NCMC3NS1', name: 'NSS – 1', credits: 0 },
              { code: '23NCMC3YG1', name: 'Yoga – 1', credits: 0 },
              { code: '23NCMC3PE1', name: 'Physical Education (Sports & Athletics) – 1', credits: 0 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { code: '23CV4ESBDC', name: 'Building Drawing and CAD', credits: 5 },
              { code: '23CV4PCCON', name: 'Concrete Technology', credits: 4 },
              { code: '23CV4PCENV', name: 'Environmental Engineering – I', credits: 3 },
              { code: '23CV4PCGTE', name: 'Geotechnical Engineering – I', credits: 6 },
              { code: '23CV4PCHYE', name: 'Hydraulic Engineering', credits: 5 },
              { code: '23CV4PCSTA', name: 'Structural Analysis', credits: 5 },
              { code: '22MA4HSUHV', name: 'Universal Human Values', credits: 1 },
              { code: '23CV4AEBIM', name: 'Introduction to Building Information Modeling', credits: 1 },
              { code: '23NCMC4NS2', name: 'NSS – 2', credits: 0 },
              { code: '23NCMC4YG2', name: 'Yoga – 2', credits: 0 },
              { code: '23NCMC4PE2', name: 'Physical Education (Sports & Athletics) – 2', credits: 0 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { code: '23CV5PCDRC', name: 'Design of RC Structural Elements', credits: 4 },
              { code: '23CV5PCENV', name: 'Environmental Engineering – II', credits: 4 },
              { code: '23CV5PCGTE', name: 'Geotechnical Engineering – II', credits: 4 },
              { code: '23CV5PCHEN', name: 'Highway Engineering', credits: 5 },
              { code: '23CV5PCSSA', name: 'Structural Systems Analysis', credits: 3 },
              { code: '23CV5PEXXX', name: 'Professional Elective – I', credits: 3 },
              { code: '23CV5PWMIP', name: 'Minor Project', credits: 4 },
              { code: '23CV5AERMY', name: 'Research Methodology', credits: 2 },
              { code: '23CV5HSEVS', name: 'Environmental Studies', credits: 1 },
              { code: '23NCMC5NS3', name: 'NSS – 3', credits: 0 },
              { code: '23NCMC5YG3', name: 'Yoga – 3', credits: 0 },
              { code: '23NCMC5PE3', name: 'Physical Education (Sports & Athletics) – 3', credits: 0 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { code: '23CV6PCXXX', name: 'Professional Core Course 1', credits: 0 },
              { code: '23CV6PCXXX', name: 'Professional Core Course 2', credits: 0 },
              { code: '23CV6PCXXX', name: 'Professional Core Course 3', credits: 0 },
              { code: '23CV6PEXXX', name: 'Professional Elective – II', credits: 3 },
              { code: '23CV6OEXXX', name: 'Open Elective – I', credits: 3 },
              { code: '23CV6PWMJ1', name: 'Project Work – I', credits: 3 },
              { code: '23CV6AEPMT', name: 'Project Management', credits: 2 },
              { code: '23NCMC6NS4', name: 'NSS – 4', credits: 0 },
              { code: '23NCMC6YG4', name: 'Yoga – 4', credits: 0 },
              { code: '23NCMC6PE4', name: 'Physical Education (Sports & Athletics) – 4', credits: 0 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { code: '23CV7PCXXX', name: 'Professional Core Course', credits: 4 },
              { code: '23CV7PEXXX', name: 'Professional Elective – III', credits: 3 },
              { code: '23CV7OEXXX', name: 'Open Elective – II', credits: 3 },
              { code: '23CV7PWMJ2', name: 'Project Work – II', credits: 7 },
              { code: '23CV7PCPPR', name: 'Professional Practice in Civil Engineering', credits: 1 },
              { code: '25MA7HSIKL', name: 'Indian Knowledge Systems', credits: 1 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { code: '23CV8PEXXX', name: 'Professional Elective – IV', credits: 3 },
              { code: '23CV8OEXXX', name: 'Open Elective – III', credits: 3 },
              { code: '23CV8SRINT', name: 'Seminar on Internship', credits: 6 }
            ]
          }
        ]
      }
    ]
  }
];

export default function ImportSubjectsScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  const { addSubject, removeSubject, subjects: storeSubjects } = useSubjectStore();
  const profile = useProfileStore(s => s.profile);
  const addEntry = useTimetableStore(s => s.addEntry);

  const [step, setStep] = useState<'college' | 'branch' | 'semester'>('college');
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const currentCollegeData = data.find(c => c.college === selectedCollege);
  const currentBranchData = currentCollegeData?.branches.find(b => b.branch === selectedBranch);

  const handleImport = (semesterData: any) => {
    if (profile?.branch && profile.branch.trim() !== '' && currentBranchData) {
      const pb = profile.branch.toLowerCase().trim();
      const bb = currentBranchData.branch.toLowerCase();
      const aliases = (currentBranchData as any).aliases || [];
      
      const isMatch = pb.includes(bb) || bb.includes(pb) || aliases.some((alias: string) => pb === alias || pb.includes(alias) || alias.includes(pb));
      
      if (!isMatch) {
        Alert.alert('Branch Mismatch', `You can only import subjects for your branch (${profile.branch}).`);
        return;
      }
    }

    if (!semesterData.targetSemesters.includes(profile?.currentSemester || 1)) {
      Alert.alert(
        'Semester Mismatch',
        `You are currently in Semester ${profile?.currentSemester || 1}. You can only import subjects for your active semester.`
      );
      return;
    }

    Alert.alert(
      'Import Subjects',
      `Are you sure you want to import ${semesterData.subjects.length} subjects for ${semesterData.name}? This will ERASE any existing subjects and data for your current semester and replace them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import & Replace',
          style: 'destructive',
          onPress: () => {
            const currentSemesterId = profile?.currentSemester?.toString() || '1';
            
            // Delete existing subjects for this semester
            const existingSubjects = storeSubjects.filter(s => s.semesterId === currentSemesterId);
            existingSubjects.forEach(s => removeSubject(s.id));
            
            semesterData.subjects.forEach((sub: any) => {
              const theme = getSubjectTheme(sub.name, '', isDark);
              addSubject({
                name: sub.name,
                credits: sub.credits,
                code: sub.code,
                semesterId: currentSemesterId,
                type: sub.name.toLowerCase().includes('lab') || sub.name.toLowerCase().includes('project') || sub.name.toLowerCase().includes('internship') ? 'lab' : 'theory',
                color: theme.color,
                icon: theme.icon,
              });
            });
            
            Alert.alert('Success', 'Subjects imported successfully!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      const fileString = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      
      let parsedData;
      try {
        parsedData = JSON.parse(fileString);
      } catch (e) {
        Alert.alert('Invalid File', 'The selected file is not a valid JSON.');
        return;
      }

      if (parsedData.type !== 'campusiq_subjects' && parsedData.type !== 'campusiq_timetable') {
        Alert.alert('Invalid File', 'The selected file does not appear to be a CampusIQ subjects or timetable file.');
        return;
      }

      if (!parsedData.subjects || !Array.isArray(parsedData.subjects)) {
        Alert.alert('Invalid File', 'The file is missing subjects data.');
        return;
      }
      
      const isTimetable = parsedData.type === 'campusiq_timetable';

      if (isTimetable && (!parsedData.entries || !Array.isArray(parsedData.entries))) {
        Alert.alert('Invalid File', 'The file is missing timetable entries data.');
        return;
      }

      // Check semester match
      if (parsedData.semester && parsedData.semester !== (profile?.currentSemester || 1)) {
        Alert.alert(
          'Semester Mismatch', 
          `This file is for Semester ${parsedData.semester}, but you are currently in Semester ${profile?.currentSemester || 1}.`
        );
        return;
      }

      const alertTitle = isTimetable ? 'Import Timetable' : 'Import Subjects';
      const alertMessage = isTimetable 
        ? `Caution: You are importing a full Timetable file. This will update all your classes AND subjects for your current semester. This will ERASE any existing subjects and classes for your current semester.`
        : `Are you sure you want to import ${parsedData.subjects.length} subjects from this file? This will ERASE any existing subjects for your current semester.`;

      Alert.alert(
        alertTitle,
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => {
              const currentSemesterId = profile?.currentSemester?.toString() || '1';
              
              const existingSubjects = storeSubjects.filter(s => s.semesterId === currentSemesterId);
              existingSubjects.forEach(s => removeSubject(s.id));
              
              const subjectIdMap: Record<string, string> = {};

              parsedData.subjects.forEach((sub: any) => {
                const theme = getSubjectTheme(sub.name, '', isDark);
                const newSub = addSubject({
                  name: sub.name,
                  code: sub.code,
                  faculty: sub.faculty,
                  credits: sub.credits,
                  semesterId: currentSemesterId,
                  type: sub.type || (sub.name.toLowerCase().includes('lab') || sub.name.toLowerCase().includes('project') || sub.name.toLowerCase().includes('internship') ? 'lab' : 'theory'),
                  color: sub.color || theme.color,
                  icon: sub.icon || theme.icon,
                });
                subjectIdMap[sub.id] = newSub.id;
              });
              
              if (isTimetable) {
                parsedData.entries.forEach((entry: any) => {
                  if (subjectIdMap[entry.subjectId]) {
                    addEntry({
                      subjectId: subjectIdMap[entry.subjectId],
                      dayOfWeek: entry.dayOfWeek,
                      date: entry.date,
                      startTime: entry.startTime,
                      endTime: entry.endTime,
                      room: entry.room,
                      type: entry.type || 'lecture',
                      color: entry.color,
                    });
                  }
                });
              }

              Alert.alert('Success', `${isTimetable ? 'Timetable' : 'Subjects'} imported successfully!`, [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          }
        ]
      );

    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'An error occurred while importing the file.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => {
            if (step === 'semester') {
              setStep('branch');
              setSelectedBranch(null);
            } else if (step === 'branch') {
              setStep('college');
              setSelectedCollege(null);
            } else {
              router.back();
            }
          }} 
          style={styles.backBtn} 
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Import Subjects</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: 24 }]}>
          {step === 'college' && "Select your college to see available subject presets."}
          {step === 'branch' && `Select your branch for ${selectedCollege}.`}
          {step === 'semester' && `Select your semester to import subjects.`}
        </Text>

        {step === 'college' && (
          <Animated.View entering={FadeInRight}>
            {data.map((c, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface, borderColor: colors.borderLight }
                ]}
                onPress={() => {
                  setSelectedCollege(c.college);
                  setStep('branch');
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="school" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.h3, { color: colors.textPrimary }]}>{c.college}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
              </Pressable>
            ))}

            <View style={{ height: 24 }} />
            
            <Pressable
              style={({ pressed }) => [
                styles.customImportBtn,
                { backgroundColor: pressed ? colors.primary + '15' : colors.primary + '08', borderColor: colors.primary + '40' }
              ]}
              onPress={handleFileImport}
            >
              <View style={[styles.customImportIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodySemiBold, { color: colors.primary, fontSize: 16 }]}>Import from File</Text>
                <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 4 }]}>Select a .json file</Text>
              </View>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
            </Pressable>
          </Animated.View>
        )}

        {step === 'branch' && currentCollegeData && (
          <Animated.View entering={FadeInRight}>
            {currentCollegeData.branches.map((b, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface, borderColor: colors.borderLight }
                ]}
                onPress={() => {
                  setSelectedBranch(b.branch);
                  setStep('semester');
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: '#3B82F6' + '20' }]}>
                  <Ionicons name="git-branch" size={24} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, fontSize: 16 }]}>{b.branch}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
              </Pressable>
            ))}
          </Animated.View>
        )}

        {step === 'semester' && currentBranchData && (
          <Animated.View entering={FadeInRight}>
            {currentBranchData.semesters.map((s, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: pressed ? colors.surfaceHover : colors.surface, borderColor: colors.borderLight }
                ]}
                onPress={() => handleImport(s)}
              >
                <View style={[styles.iconWrap, { backgroundColor: '#10B981' + '20' }]}>
                  <Ionicons name="book" size={24} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, fontSize: 16 }]}>{s.name}</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 4 }]}>{s.subjects.length} Subjects</Text>
                </View>
                <Ionicons name="download-outline" size={24} color={colors.primary} />
              </Pressable>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  customImportIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  }
});
