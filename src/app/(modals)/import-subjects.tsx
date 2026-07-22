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
              { name: 'Mathematical Foundation for Computer Science – I', credits: 4 },
              { name: 'Quantum Physics and Computation', credits: 4 },
              { name: 'Essentials of Information Technology', credits: 3 },
              { name: 'Structured Programming in C', credits: 4 },
              { name: 'Innovation & Design Thinking', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 },
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { name: 'Mathematical Foundation for Computer Science – II', credits: 4 },
              { name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { name: 'Introduction to AI Applications', credits: 3 },
              { name: 'Introduction to Python Programming', credits: 4 },
              { name: 'Communication Skills', credits: 1 },
              { name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 },
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { name: 'Statistics and Discrete Mathematics', credits: 3 },
              { name: 'Computer Organization and Architecture', credits: 3 },
              { name: 'Object Oriented Java Programming', credits: 4 },
              { name: 'Logic Design', credits: 2 },
              { name: 'Database Management Systems', credits: 4 },
              { name: 'Data Structures', credits: 4 },
              { name: 'Unix Shell Programming', credits: 1 },
              { name: 'Full Stack Web Development', credits: 1 },
              { name: 'Technical Writing', credits: 1 },
              { name: 'Assembly Language', credits: 1 },
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { name: 'Linear Algebra and Optimization', credits: 3 },
              { name: 'Cryptography', credits: 3 },
              { name: 'Theoretical Foundations of Computation', credits: 3 },
              { name: 'Operating Systems', credits: 4 },
              { name: 'Analysis and Design of Algorithms', credits: 4 },
              { name: 'Software Engineering', credits: 3 },
              { name: 'Universal Human Values', credits: 1 },
              { name: 'Mobile Application Development', credits: 1 },
              { name: 'UI/UX Design', credits: 1 },
              { name: 'Hardware Interface Design', credits: 1 },
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { name: 'Object Oriented Modelling', credits: 3 },
              { name: 'Data Exploration and Visualization', credits: 3 },
              { name: 'Artificial Intelligence', credits: 4 },
              { name: 'Computer Networks', credits: 4 },
              { name: 'Environmental Studies', credits: 1 },
              { name: 'Bio Inspired Systems', credits: 1 },
              { name: 'Professional Elective I', credits: 3 },
              { name: 'Automated Software Testing', credits: 1 },
              { name: 'Competitive Coding', credits: 1 },
              { name: 'DevOps Tools', credits: 1 },
              { name: 'Mini Project', credits: 2 },
              { name: 'Robot Process Automation Design & Development', credits: 3 },
              { name: 'Compiler Design', credits: 3 },
              { name: 'Computer Graphics', credits: 3 },
              { name: 'Advanced Algorithms', credits: 3 },
              { name: 'Product, Services & IT Service Management', credits: 3 },
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { name: 'Cloud Computing', credits: 3 },
              { name: 'Big Data Analytics', credits: 4 },
              { name: 'Machine Learning', credits: 4 },
              { name: 'Research Methodology & IPR', credits: 3 },
              { name: 'Major Project – Phase I', credits: 2 },
              { name: 'Advanced Computer Networks', credits: 3 },
              { name: 'Blockchain Technology', credits: 3 },
              { name: 'Computer Vision & Image Processing', credits: 3 },
              { name: 'Advanced Data Structures', credits: 3 },
              { name: 'Artificial Intelligence', credits: 3 },
              { name: 'Cryptography', credits: 3 },
              { name: 'Data Structures using C', credits: 3 },
              { name: 'Robot Process Automation Design & Development', credits: 3 },
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { name: 'Network Programming', credits: 3 },
              { name: 'Management & Entrepreneurship', credits: 3 },
              { name: 'Major Project – Phase II', credits: 8 },
              { name: 'Indian Knowledge Systems', credits: 1 },
              { name: 'Software Architecture', credits: 3 },
              { name: 'Soft Computing', credits: 3 },
              { name: 'Natural Language Processing', credits: 3 },
              { name: 'Wireless & Mobile Communication', credits: 3 },
              { name: 'NPTEL Course I', credits: 3 },
              { name: 'Introduction to Machine Learning', credits: 3 },
              { name: 'Information & Network Security', credits: 3 },
              { name: 'Analysis and Design of Algorithms', credits: 3 },
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { name: 'Internship', credits: 6 },
              { name: 'Network Security', credits: 3 },
              { name: 'Neural Networks & Deep Learning', credits: 3 },
              { name: 'Virtual & Augmented Reality', credits: 3 },
              { name: 'High Performance Computing', credits: 3 },
              { name: 'NPTEL Course II', credits: 3 },
              { name: 'Deep Learning', credits: 3 },
              { name: 'Cyber Security', credits: 3 },
              { name: 'Object Oriented Programming with Java', credits: 3 },
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
              { name: 'Mathematical Foundation for Computer Science – I', credits: 4 },
              { name: 'Quantum Physics and Computation', credits: 4 },
              { name: 'Essentials of Information Technology', credits: 3 },
              { name: 'Structured Programming in C', credits: 4 },
              { name: 'Innovation & Design Thinking', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { name: 'Mathematical Foundation for Computer Science – II', credits: 4 },
              { name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { name: 'Introduction to AI Applications', credits: 3 },
              { name: 'Introduction to Python Programming', credits: 4 },
              { name: 'Communication Skills', credits: 1 },
              { name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { name: 'Materials Science and Metallurgy', credits: 3 },
              { name: 'Engineering Thermodynamics', credits: 4 },
              { name: 'Manufacturing Processes', credits: 4 },
              { name: 'Strength of Materials', credits: 4 },
              { name: 'Computer Aided Machine Drawing', credits: 2 },
              { name: 'Biology for Engineers', credits: 1 },
              { name: 'Machine Learning for Mechanical Engineers', credits: 1 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { name: 'Complex Analysis, Probability and Statistical Methods', credits: 3 },
              { name: 'Operations Research', credits: 3 },
              { name: 'Fluid Mechanics', credits: 4 },
              { name: 'Manufacturing Technology', credits: 3 },
              { name: 'Theory of Machines', credits: 4 },
              { name: 'Design of Machine Elements – I', credits: 3 },
              { name: 'Digital Twin and Ideation', credits: 1 },
              { name: 'Universal Human Values', credits: 1 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { name: 'Design of Machine Elements – II', credits: 3 },
              { name: 'Mechanical Measurements and Metrology', credits: 4 },
              { name: 'Mechanical Vibrations', credits: 3 },
              { name: 'Thermal and Fluids Engineering', credits: 4 },
              { name: 'Mini Project Work', credits: 2 },
              { name: 'Environmental Studies', credits: 1 },
              { name: 'Research Methodology', credits: 2 },
              { name: 'Advanced Mechanics of Solids', credits: 3 },
              { name: 'Renewable Energy Sources', credits: 3 },
              { name: 'Incompressible Fluid Dynamics', credits: 3 },
              { name: 'Non-Traditional Machining', credits: 3 },
              { name: 'Production and Operation Management', credits: 3 },
              { name: 'Python Programming for Mechanical Engineers', credits: 3 },
              { name: 'Electric Hybrid Vehicles', credits: 3 },
              { name: 'Design & Development of Composites', credits: 3 },
              { name: 'Drones & UAV Technology', credits: 3 },
              { name: 'Biomechanics of Human Movement', credits: 3 },
              { name: 'Applied Electronics, Microprocessor and Microcontroller', credits: 3 },
              { name: 'Flexible Manufacturing System', credits: 3 },
              { name: 'Artificial Intelligence & Machine Learning', credits: 3 },
              { name: 'Gas Dynamics', credits: 3 },
              { name: 'Management and Entrepreneurship', credits: 3 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { name: 'Modelling and Finite Element Analysis', credits: 4 },
              { name: 'Automation and Robotics', credits: 3 },
              { name: 'Heat Transfer', credits: 4 },
              { name: 'Control Engineering', credits: 3 },
              { name: 'Project Work Phase – I', credits: 2 },
              { name: 'Computational Fluid Dynamics', credits: 3 },
              { name: 'Battery Technology', credits: 3 },
              { name: 'Additive Manufacturing', credits: 3 },
              { name: 'Surface Engineering', credits: 3 },
              { name: 'Financial Management and Accounting', credits: 3 },
              { name: 'Engineering Optimization', credits: 3 },
              { name: 'Noise, Vibration and Harshness (NVH)', credits: 3 },
              { name: 'HVAC Industrial Applications', credits: 3 },
              { name: 'Human Resources Management', credits: 3 },
              { name: 'Digital Manufacturing', credits: 3 },
              { name: 'Computer Integrated Manufacturing', credits: 3 },
              { name: 'Automotive Electronics', credits: 3 },
              { name: 'Data Science for Mechanical Engineers', credits: 3 },
              { name: 'Internal Combustion Engines', credits: 3 },
              { name: 'Material Characterization', credits: 3 },
              { name: 'Fundamentals of Robotics', credits: 3 },
              { name: 'Digital Marketing', credits: 3 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { name: 'Mechatronics', credits: 3 },
              { name: 'Design Lab', credits: 1 },
              { name: 'Advanced Manufacturing Lab', credits: 1 },
              { name: 'Project Management and Finance', credits: 2 },
              { name: 'Project Work Phase – II', credits: 7 },
              { name: 'Non-Destructive Testing', credits: 3 },
              { name: 'Product Design and Manufacturing', credits: 3 },
              { name: 'Industry 4.0', credits: 3 },
              { name: 'Total Quality Management', credits: 3 },
              { name: 'Experimental Fluid Dynamics', credits: 3 },
              { name: 'Tool Engineering Design', credits: 3 },
              { name: 'Hydraulics and Pneumatics', credits: 3 },
              { name: 'Fundamentals of Boiling Heat Transfer', credits: 3 },
              { name: 'Experimental Stress Analysis', credits: 3 },
              { name: 'Battery Management System', credits: 3 },
              { name: 'Power Plant Engineering', credits: 3 },
              { name: 'Automotive Engineering', credits: 3 },
              { name: 'Sustainable Engineering', credits: 3 },
              { name: 'Optimization Techniques', credits: 3 },
              { name: 'Data Science using Python', credits: 3 },
              { name: 'Consumer Behaviour', credits: 3 },
              { name: 'Laws of Performance', credits: 3 },
              { name: 'Project Management', credits: 3 },
              { name: 'Advanced Robotics', credits: 3 },
              { name: 'Operations Research', credits: 3 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { name: 'Internship', credits: 6 },
              { name: 'Fracture Mechanics', credits: 3 },
              { name: 'Advanced Material Processing', credits: 3 },
              { name: 'Energy Management and Auditing', credits: 3 },
              { name: 'Tribology', credits: 3 },
              { name: 'Energy Engineering', credits: 3 },
              { name: 'Polymer Science and Technology', credits: 3 },
              { name: 'Financial Management', credits: 3 },
              { name: 'Organizational Behaviour', credits: 3 },
              { name: 'Operations Research', credits: 3 },
              { name: 'Wearable Robotics', credits: 3 }
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
              { name: 'Mathematical Foundation for Computer Science – I', credits: 4 },
              { name: 'Quantum Physics and Computation', credits: 4 },
              { name: 'Essentials of Information Technology', credits: 3 },
              { name: 'Structured Programming in C', credits: 4 },
              { name: 'Innovation & Design Thinking', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { name: 'Mathematical Foundation for Computer Science – II', credits: 4 },
              { name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { name: 'Introduction to AI Applications', credits: 3 },
              { name: 'Introduction to Python Programming', credits: 4 },
              { name: 'Communication Skills', credits: 1 },
              { name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { name: 'Electromagnetic Field Theory', credits: 3 },
              { name: 'Network Analysis', credits: 3 },
              { name: 'Measurements and Instrumentation', credits: 3 },
              { name: 'Transformers and DC Machines', credits: 4 },
              { name: 'Digital Electronic Circuits', credits: 4 },
              { name: 'Biology for Engineers', credits: 1 },
              { name: 'Circuits and Measurements Lab', credits: 1 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { name: 'Mathematical Applications to Electrical Systems', credits: 2 },
              { name: 'Control Theory', credits: 4 },
              { name: 'Induction Motors and Synchronous Machines', credits: 4 },
              { name: 'Generation, Transmission and Distribution', credits: 3 },
              { name: 'ARM Processor and Programming', credits: 4 },
              { name: 'Analog Electronics and Linear Integrated Circuits', credits: 3 },
              { name: 'Universal Human Values', credits: 1 },
              { name: 'Analog Electronics and PCB Design Lab', credits: 1 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { name: 'Power System – I', credits: 3 },
              { name: 'Modern Control Theory', credits: 3 },
              { name: 'Power Electronics', credits: 4 },
              { name: 'Power System Protection', credits: 4 },
              { name: 'Environmental Studies', credits: 1 },
              { name: 'Mini Project', credits: 2 },
              { name: 'Project Management and Finance', credits: 2 },
              { name: 'Special Electrical Machines', credits: 3 },
              { name: 'Sustainable Energy Systems', credits: 3 },
              { name: 'Digital System Design using Verilog', credits: 3 },
              { name: 'C++ and Data Structures', credits: 3 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { name: 'Advanced Power Electronics and Electric Drives', credits: 4 },
              { name: 'Power Systems – II', credits: 3 },
              { name: 'Signal Processing', credits: 4 },
              { name: 'Project Work – I', credits: 2 },
              { name: 'Computer Applications for Modern Power Systems', credits: 1 },
              { name: 'Research Methodology and IPR', credits: 2 },
              { name: 'Switch Mode Power Conversion', credits: 3 },
              { name: 'Electrical Machine Design and Drawing', credits: 3 },
              { name: 'Fundamentals of VLSI', credits: 3 },
              { name: 'Database Management Systems', credits: 3 },
              { name: 'Solar and Wind Energy Technologies', credits: 3 },
              { name: 'Electrical and Electronics Engineering Materials', credits: 3 },
              { name: 'Fuzzy Logic and Neural Networks', credits: 3 },
              { name: 'IoT and Applications', credits: 3 },
              { name: 'PLC and SCADA', credits: 3 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { name: 'High Voltage and Insulation Engineering', credits: 3 },
              { name: 'Power Systems Operation and Control', credits: 3 },
              { name: 'Project – II', credits: 7 },
              { name: 'Indian Knowledge Systems', credits: 1 },
              { name: 'Electric Vehicle Technology', credits: 3 },
              { name: 'Electrical Power Utilization and Traction', credits: 3 },
              { name: 'Embedded Systems', credits: 3 },
              { name: 'Fundamentals of Robotics', credits: 3 },
              { name: 'Smart Grid Technology', credits: 3 },
              { name: 'Electrical Power Quality', credits: 3 },
              { name: 'Electrical Energy Conservation and Auditing', credits: 3 },
              { name: 'Micro Fabrication & Semiconductor Manufacturing using 3D Simulator', credits: 3 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { name: 'Internship Based Seminar', credits: 6 },
              { name: 'Energy Storage Systems', credits: 3 },
              { name: 'Electro Magnetic Compatibility', credits: 3 },
              { name: 'Communication Systems', credits: 3 },
              { name: 'AI & ML Techniques in Electrical Power Systems', credits: 3 },
              { name: 'Holistic Approach to Electrical Safety', credits: 3 },
              { name: 'Operations Research', credits: 3 },
              { name: 'Electric and Hybrid Vehicles (Except EEE)', credits: 3 },
              { name: 'Electrical System Estimation and Costing', credits: 3 }
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
              { name: 'Mathematical Foundation for Computer Science – I', credits: 4 },
              { name: 'Quantum Physics and Computation', credits: 4 },
              { name: 'Essentials of Information Technology', credits: 3 },
              { name: 'Structured Programming in C', credits: 4 },
              { name: 'Innovation & Design Thinking', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { name: 'Mathematical Foundation for Computer Science – II', credits: 4 },
              { name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { name: 'Introduction to AI Applications', credits: 3 },
              { name: 'Introduction to Python Programming', credits: 4 },
              { name: 'Communication Skills', credits: 1 },
              { name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { name: 'Transform Calculus, Fourier Series and Numerical Techniques', credits: 4 },
              { name: 'HDL Programming', credits: 3 },
              { name: 'Analog Electronic Circuits', credits: 3 },
              { name: 'Digital Circuit Design', credits: 3 },
              { name: 'Signals and Systems', credits: 4 },
              { name: 'Network Analysis', credits: 3 },
              { name: 'Biology for Engineers', credits: 1 },
              { name: 'Integrated Electronics Lab', credits: 1 },
              { name: 'HDL Programming Lab', credits: 1 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { name: 'Complex Analysis, Probability and Statistical Methods', credits: 4 },
              { name: 'Control Systems', credits: 4 },
              { name: 'Fields and Waves', credits: 4 },
              { name: 'Analog Integrated Circuits', credits: 3 },
              { name: 'ARM Processor and Programming', credits: 4 },
              { name: 'Principles of Communication Systems', credits: 4 },
              { name: 'Universal Human Values', credits: 1 },
              { name: 'Applied Python Programming Lab', credits: 1 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { name: 'Fundamentals of VLSI', credits: 3 },
              { name: 'Microwave Theory and Antenna', credits: 4 },
              { name: 'Digital Signal Processing', credits: 3 },
              { name: 'Digital Communication Theory', credits: 4 },
              { name: 'Environmental Studies', credits: 1 },
              { name: 'Project Management and Finance', credits: 2 },
              { name: 'Mini Project', credits: 2 },
              { name: 'Image Processing', credits: 3 },
              { name: 'Satellite Communication', credits: 3 },
              { name: 'Introduction to AI', credits: 3 },
              { name: 'Introduction to AR/VR', credits: 3 },
              { name: 'Operating Systems', credits: 3 },
              { name: 'IoT and its Applications', credits: 3 },
              { name: 'Advanced Digital Logic Design', credits: 3 },
              { name: 'Information Theory for Cybersecurity', credits: 3 },
              { name: 'Object Oriented Programming using C++', credits: 3 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { name: 'Wireless Communication and Networks', credits: 3 },
              { name: 'Computer Communication Networks', credits: 4 },
              { name: 'Mixed Signal Design', credits: 4 },
              { name: 'Research Methodology and IPR', credits: 2 },
              { name: 'Advanced Signal Processing Lab', credits: 1 },
              { name: 'Project Work – I', credits: 2 },
              { name: 'Computer Vision', credits: 3 },
              { name: 'Radar System', credits: 3 },
              { name: 'Machine Learning', credits: 3 },
              { name: 'System Verilog and Verification', credits: 3 },
              { name: 'Data Encryption and Compression', credits: 3 },
              { name: 'Data Structures using C++', credits: 3 },
              { name: 'Multi-core Computing', credits: 3 },
              { name: 'Wireless Sensor Networks', credits: 3 },
              { name: 'Design of Virtual Reality', credits: 3 },
              { name: 'Applied Electronics', credits: 3 },
              { name: 'Introduction to Robotics', credits: 3 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { name: 'Embedded System Design', credits: 4 },
              { name: 'Electronics and Communication for Sustainable Development', credits: 2 },
              { name: 'Project Work – II', credits: 7 },
              { name: 'Indian Knowledge Systems', credits: 1 },
              { name: 'Speech Processing', credits: 3 },
              { name: 'Optical Communication', credits: 3 },
              { name: 'Physical Design', credits: 3 },
              { name: 'Firmware Design', credits: 3 },
              { name: 'Deep Learning', credits: 3 },
              { name: '3D Modeling for Virtual Reality', credits: 3 },
              { name: 'Steganography and Digital Watermarking', credits: 3 },
              { name: 'Data Analytics and Security in IoT', credits: 3 },
              { name: 'Java Scripting', credits: 3 },
              { name: 'Power Electronics', credits: 3 },
              { name: 'Engineering Materials and Sensors', credits: 3 },
              { name: 'Signal Processing', credits: 3 },
              { name: 'Robotic Systems and Control', credits: 3 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { name: 'Internship', credits: 6 },
              { name: 'Multimedia Communication', credits: 3 },
              { name: 'Next Generation Networks', credits: 3 },
              { name: 'Real-Time Systems', credits: 3 },
              { name: 'Low Power VLSI', credits: 3 },
              { name: 'UI/UX Design', credits: 3 },
              { name: 'Applications of AI', credits: 3 },
              { name: 'Database Security and Access Control', credits: 3 },
              { name: 'Applications of Mixed Reality', credits: 3 },
              { name: '5G Enabled IoT', credits: 3 },
              { name: 'Automotive Electronics', credits: 3 },
              { name: 'Applications of Robotics', credits: 3 },
              { name: 'IoT for Structures', credits: 3 },
              { name: 'Mobile Technology and Applications', credits: 3 }
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
              { name: 'Mathematical Foundation for Computer Science – I', credits: 4 },
              { name: 'Quantum Physics and Computation', credits: 4 },
              { name: 'Essentials of Information Technology', credits: 3 },
              { name: 'Structured Programming in C', credits: 4 },
              { name: 'Innovation & Design Thinking', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'First Year – Chemistry Cycle',
            targetSemesters: [1, 2],
            subjects: [
              { name: 'Mathematical Foundation for Computer Science – II', credits: 4 },
              { name: 'Applied Chemistry for Smart Systems', credits: 4 },
              { name: 'Introduction to AI Applications', credits: 3 },
              { name: 'Introduction to Python Programming', credits: 4 },
              { name: 'Communication Skills', credits: 1 },
              { name: 'IDEA Lab (Multidisciplinary)', credits: 1 },
              { name: 'Computer-Aided Engineering Drawing', credits: 3 },
              { name: 'Building Science & Mechanics', credits: 3 },
              { name: 'Introduction to Electrical Engineering', credits: 3 },
              { name: 'Introduction to Electronics & Communication Engineering', credits: 3 },
              { name: 'Introduction to Mechanical Engineering', credits: 3 }
            ]
          },
          {
            name: 'Semester III',
            targetSemesters: [3],
            subjects: [
              { name: 'Mathematics for Civil Engineering – III', credits: 4 },
              { name: 'Building Materials and Construction', credits: 4 },
              { name: 'Engineering Geology', credits: 4 },
              { name: 'Fluid Mechanics', credits: 4 },
              { name: 'Geodesy', credits: 6 },
              { name: 'Strength of Materials', credits: 5 },
              { name: 'Biology for Engineers', credits: 1 },
              { name: 'Introduction to MS Excel', credits: 1 }
            ]
          },
          {
            name: 'Semester IV',
            targetSemesters: [4],
            subjects: [
              { name: 'Building Drawing and CAD', credits: 5 },
              { name: 'Concrete Technology', credits: 4 },
              { name: 'Environmental Engineering – I', credits: 3 },
              { name: 'Geotechnical Engineering – I', credits: 6 },
              { name: 'Hydraulic Engineering', credits: 5 },
              { name: 'Structural Analysis', credits: 5 },
              { name: 'Universal Human Values', credits: 2 },
              { name: 'Introduction to Building Information Modeling', credits: 1 }
            ]
          },
          {
            name: 'Semester V',
            targetSemesters: [5],
            subjects: [
              { name: 'Design of RC Structural Elements', credits: 4 },
              { name: 'Environmental Engineering – II', credits: 4 },
              { name: 'Geotechnical Engineering – II', credits: 4 },
              { name: 'Highway Engineering', credits: 5 },
              { name: 'Structural Systems Analysis', credits: 3 },
              { name: 'Minor Project', credits: 4 },
              { name: 'Research Methodology', credits: 2 },
              { name: 'Environmental Studies', credits: 1 },
              { name: 'Advanced Concrete Technology', credits: 3 },
              { name: 'Air Pollution and Control', credits: 3 },
              { name: 'Alternative Building Materials and Technology', credits: 3 },
              { name: 'Geospatial Survey', credits: 3 },
              { name: 'Marine Engineering', credits: 3 },
              { name: 'Traffic Engineering', credits: 3 }
            ]
          },
          {
            name: 'Semester VI',
            targetSemesters: [6],
            subjects: [
              { name: 'Design of Steel Structural Elements and Software Applications Lab', credits: 5 },
              { name: 'Bridge Engineering and Foundation Systems', credits: 4 },
              { name: 'Hydrology and Irrigation Engineering', credits: 3 },
              { name: 'Transportation Systems Engineering', credits: 3 },
              { name: 'Project Management and Finance', credits: 2 },
              { name: 'Major Project Phase I', credits: 4 },
              { name: 'Extensive Survey Project', credits: 2 },
              { name: 'Basics of Flood Analysis', credits: 3 },
              { name: 'Computational Method of Structural Analysis', credits: 3 },
              { name: 'Design of Tall Structures', credits: 3 },
              { name: 'Ground Improvement Techniques', credits: 3 },
              { name: 'Pavement Design', credits: 3 },
              { name: 'Pavement Materials and Construction', credits: 3 },
              { name: 'Structural Masonry', credits: 3 },
              { name: 'Solid Waste Management', credits: 3 },
              { name: 'Climate Change and Carbon Capture', credits: 3 },
              { name: 'Disaster Management and Mitigation Techniques', credits: 3 },
              { name: 'Mechanics of FRP Composites', credits: 3 }
            ]
          },
          {
            name: 'Semester VII',
            targetSemesters: [7],
            subjects: [
              { name: 'Quantity Survey and Estimation', credits: 4 },
              { name: 'Machine Learning for Civil Engineering Applications', credits: 2 },
              { name: 'Professional Practice for Civil Engineers', credits: 1 },
              { name: 'Major Project Phase II', credits: 14 },
              { name: 'Indian Knowledge Systems', credits: 1 },
              { name: 'Advanced Design of RC Structures', credits: 3 },
              { name: 'Earth Retaining Structures', credits: 3 },
              { name: 'Industrial Wastewater Treatment', credits: 3 },
              { name: 'Structural Dynamics', credits: 3 },
              { name: 'Geometric Design of Roads', credits: 3 },
              { name: 'Ground Water Hydrology', credits: 3 },
              { name: 'Prestressed Concrete Structures', credits: 3 },
              { name: 'Finite Element Analysis', credits: 3 },
              { name: 'Remote Sensing and GIS', credits: 3 }
            ]
          },
          {
            name: 'Semester VIII',
            targetSemesters: [8],
            subjects: [
              { name: 'Seminar on Internship', credits: 6 },
              { name: 'Earthquake Resistant Design of Structures', credits: 3 },
              { name: 'Environmental Impact Assessment', credits: 3 },
              { name: 'Geosynthetics and Soil Reinforcement', credits: 3 },
              { name: 'Integrated Watershed Management', credits: 3 },
              { name: 'Urban Transport Planning', credits: 3 },
              { name: 'Occupational Safety and Health Administration', credits: 3 },
              { name: 'Sustainability and Life Cycle Assessment', credits: 3 }
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
