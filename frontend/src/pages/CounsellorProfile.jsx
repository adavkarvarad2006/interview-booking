import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Star, 
  Clock, 
  GraduationCap, 
  FileText,
  Mail,
  Phone,
  Layers,
  Sparkles,
  Building
} from 'lucide-react';

export default function CounsellorProfile() {
  const [counsellor, setCounsellor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.getCounsellorProfile();
        if (res.success) setCounsellor(res.data);
      } catch (err) {
        console.error('Failed to load counsellor profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Faculty Profile...</div>
      </div>
    );
  }

  if (!counsellor) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '16px', color: '#fff' }}>Profile Temporarily Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Could not load profile. Please verify backend server status.</p>
        <Link to="/" className="btn btn-primary">Return to Homepage</Link>
      </div>
    );
  }

  const educationList = counsellor.educationDetails && counsellor.educationDetails.length > 0 ? counsellor.educationDetails : [
    { degree: 'Ph.D', year: '2018', university: 'Periyar Maniammai Institute of Science and Technology (Deemed to be University), Thanjavur' },
    { degree: 'M.E', year: '2005', university: 'Anna University' },
    { degree: 'B.E', year: '2001', university: 'Bharathidasan University' }
  ];

  const subjectsList = counsellor.subjectsTaught && counsellor.subjectsTaught.length > 0 ? counsellor.subjectsTaught : [
    'Block Chain Technology',
    'Data Structures',
    'Operating Systems',
    'Software Engineering',
    'Compiler Design'
  ];

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container">
        {/* Profile Header Hero */}
        <div 
          className="glass-panel"
          style={{
            padding: '48px',
            marginBottom: '40px',
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95) 0%, rgba(26, 34, 54, 0.85) 100%)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={counsellor.avatar || '/dr-parkavi.jpg'}
                alt={counsellor.name}
                style={{
                  width: '210px',
                  height: '210px',
                  borderRadius: '24px',
                  objectFit: 'cover',
                  border: '2px solid rgba(99, 102, 241, 0.5)',
                  boxShadow: '0 12px 35px rgba(99, 102, 241, 0.35)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}>
                <span className="badge badge-success">
                  <span className="pulse-dot online"></span>
                  Calendly Active
                </span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '2.4rem', color: '#fff' }}>{counsellor.name || 'Dr. Parkavi A.'}</h1>
                <span className="badge badge-primary">Sole Lead Counsellor</span>
              </div>

              <div style={{ fontSize: '1.15rem', color: '#818cf8', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} />
                {counsellor.title || 'Professor | Dept of CSE(AI & ML) & CSE(CS)'}
              </div>
              <div style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '16px' }}>
                {counsellor.institution || 'Ramaiah Institute of Technology, Bengaluru'}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.7', marginBottom: '24px', maxWidth: '820px' }}>
                {counsellor.bio}
              </p>

              {/* Quick Contact Info */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap', fontSize: '0.9rem', color: '#a5b4fc' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={16} />
                  Email: <strong>{counsellor.email || 'parkavi.a@msrit.edu'}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} />
                  Phone: <strong>{counsellor.phone || 'none'}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/book?duration=15" className="btn btn-secondary">
                  <Clock size={16} />
                  Book 15-Min Counselling
                </Link>
                <Link to="/book?duration=30" className="btn btn-primary">
                  <Calendar size={16} />
                  Book 30-Min Technical Mentorship
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid: Academic Highlights, Areas of Interest, Education, Subjects Taught */}
        <div className="grid-2" style={{ gap: '28px', marginBottom: '40px' }}>
          {/* Card 1: Key Research & Academic Highlights */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={20} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Academic & Research Summary</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>21 Years</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teaching Experience</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>112</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Research Publications</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>18 Patents</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>3 Granted, 15 Published</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f472b6' }}>50+ Projects</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student Projects Guided</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              • 14 Book Chapters | 8 Consultancy Projects & MoU | 4 Seed Funded Projects
              <br />
              • 8 IEEE Funds ($2000) for event conductions | Organized 30+ IEEE Events
              <br />
              • NPTEL Translation Review Project Contributor
            </div>
          </div>

          {/* Card 2: Areas of Interest */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} color="#06b6d4" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Areas of Interest</h3>
            </div>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(counsellor.expertiseAreas || []).map((area, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <CheckCircle size={16} color="#06b6d4" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Education Details */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={20} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Education Details</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {educationList.map((edu, idx) => (
                <div key={idx} style={{ borderLeft: '3px solid #10b981', paddingLeft: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{edu.degree}</span>
                    <span className="badge badge-cyan">{edu.year}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{edu.university}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Subjects Taught */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(244, 114, 182, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookOpen size={20} color="#f472b6" />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>Subjects Taught</h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {subjectsList.map((subj, idx) => (
                <span 
                  key={idx} 
                  className="badge badge-primary"
                  style={{ padding: '10px 16px', fontSize: '0.9rem', borderRadius: '8px' }}
                >
                  {subj}
                </span>
              ))}
            </div>

            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/book" className="btn btn-primary" style={{ width: '100%' }}>
                <Calendar size={16} />
                Schedule Session With Dr. Parkavi A.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

