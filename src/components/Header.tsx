import { MapPin } from 'lucide-react'
import logo from '../assets/logo/odc-logo.jpg'

export function Header() {
  return (
    <header className="header">
      <img
        className="header__logo"
        src={logo}
        alt="Oman Dental College logo: the letters O D C above the college name in Arabic and English"
      />
      <div className="header__divider" aria-hidden="true" />
      <div className="header__titles">
        <h1>Visitor Map</h1>
        <p>Welcome to Oman Dental College</p>
      </div>
      <div className="header__spacer" />
      <span className="header__badge">
        <MapPin size={16} aria-hidden="true" />
        Al Seeb, Al Mabelah South
      </span>
    </header>
  )
}
