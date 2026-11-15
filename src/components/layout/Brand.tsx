import { Link } from 'react-router-dom';
export default function Brand() {
  return <Link to="/" aria-label="A&D MAX home" className="brand"><img src="/brand/admax-logo-360.png" width={360} height={120} alt="A&D MAX" /></Link>;
}
