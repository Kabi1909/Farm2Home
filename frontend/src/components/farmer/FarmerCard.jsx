import { Link } from 'react-router-dom';
import { MapPin,ArrowUpRight,ShieldCheck } from 'lucide-react';
import { Img,RatingStars } from '../common/UI';
import { useMarket } from '../../context/AppContext';
export default function FarmerCard({farmer:f}){const {products}=useMarket();return <Link to={'/farmers/'+f.id} className="farmer-card"><Img src={f.image} alt={f.name}/><div><span className="eyebrow"><ShieldCheck size={13}/>LOCAL GROWER</span><h3>{f.farm||f.name}</h3><p>{f.name}</p><span className="location"><MapPin size={13}/>{f.district}</span><div className="between"><RatingStars rating={f.rating}/><span>{products.filter(p=>p.farmerId===f.id&&p.enabled&&!p.draft).length} products</span></div></div><ArrowUpRight className="farmer-arrow" size={20}/></Link>;}
