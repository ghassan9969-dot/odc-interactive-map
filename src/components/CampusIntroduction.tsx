import campus from '../assets/campus/odc-building.jpg'

export function CampusIntroduction() {
  return (
    <section className="intro" aria-labelledby="intro-heading">
      <div className="intro__media">
        <img
          src={campus}
          alt="Aerial view of the Oman Dental College building, a long white block with a landscaped angled wing"
        />
      </div>
      <div className="intro__body">
        <h2 id="intro-heading">Explore Oman Dental College</h2>
        <p>Select a floor or search for a destination.</p>
      </div>
    </section>
  )
}
