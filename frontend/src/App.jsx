import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const INVALID_WHATSAPP_URL = 'https://wa.me/520000000000'

const services = {
  followers: {
    title: 'Seguidores Mexicanos',
    description: 'Compra seguidores para Instagram. Elige la cantidad que deseas para comenzar:',
    label: 'Seguidores MX',
    icon: 'users',
    items: [
      ['1,000', 90, '~$4.90 USD'], ['3,000', 120, '~$6.55 USD', 'Descuento del 55%'],
      ['5,000', 150, '~$8.20 USD', 'Descuento del 67%'], ['10,000', 180, '~$9.85 USD', 'Descuento del 80%'],
      ['15,000', 240, '~$13.10 USD', 'Más vendido'], ['20,000', 300, '~$16.40 USD', 'Descuento del 83%'],
      ['40,000', 425, '~$23.00 USD', 'Descuento del 88%'], ['50,000', 485, '~$26.30 USD', 'Descuento del 89%'],
      ['100,000', 605, '~$32.85 USD', 'Descuento del 93%'],
    ],
  },
  likes: {
    title: 'Me Gustas Mexicanos', description: 'Me gustas para Instagram con entrega gradual. Elige una cantidad:', label: 'Me Gustas MX', icon: 'heart',
    items: [['100', 25, '~$1.35 USD'], ['500', 45, '~$2.45 USD'], ['1,000', 70, '~$3.80 USD', 'Más vendido'], ['3,000', 120, '~$6.55 USD'], ['5,000', 165, '~$8.95 USD'], ['10,000', 260, '~$14.10 USD']],
  },
  views: {
    title: 'Reproducciones en Reels', description: 'Aumenta las reproducciones de tus Reels. Elige una cantidad:', label: 'Reproducciones', icon: 'play',
    items: [['1,000', 20, '~$1.10 USD'], ['5,000', 45, '~$2.45 USD'], ['10,000', 70, '~$3.80 USD', 'Más vendido'], ['25,000', 120, '~$6.55 USD'], ['50,000', 180, '~$9.85 USD'], ['100,000', 290, '~$15.75 USD']],
  },
  comments: {
    title: 'Comentarios Mexicanos', description: 'Comentarios para tus publicaciones de Instagram. Elige una cantidad:', label: 'Comentarios MX', icon: 'comment',
    items: [['10', 35, '~$1.90 USD'], ['25', 65, '~$3.55 USD'], ['50', 110, '~$6.00 USD', 'Más vendido'], ['100', 190, '~$10.35 USD'], ['250', 390, '~$21.20 USD'], ['500', 690, '~$37.50 USD']],
  },
}

function Icon({ name, size = 20 }) {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>,
    play: <polygon points="5,3 19,12 5,21"/>,
    comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5A8 8 0 1 1 21 15z"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function MexicoFlag() {
  return <span className="flag" aria-label="México"><i/><i><b>◆</b></i><i/></span>
}

function InstagramIcon({ size = 20, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
}

function VerifiedIcon({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.1 2.8a4 4 0 0 1 5.8 0l.7.8 1-.1a4 4 0 0 1 4.1 4.1l-.1 1 .8.7a4 4 0 0 1 0 5.8l-.8.7.1 1a4 4 0 0 1-4.1 4.1l-1-.1-.7.8a4 4 0 0 1-5.8 0l-.7-.8-1 .1a4 4 0 0 1-4.1-4.1l.1-1-.8-.7a4 4 0 0 1 0-5.8l.8-.7-.1-1a4 4 0 0 1 4.1-4.1l1 .1.7-.8Z" fill="currentColor"/><path d="m8 12 2.5 2.5L16.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function PaymentStatusIcon({ status, size = 28 }) {
  const confirmed = ['confirmed','completed','paid','approved'].includes(status)
  const rejected = ['rejected','refused','failed','expired','cancelled'].includes(status)
  if (confirmed) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12 3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  if (rejected) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8.5 8.5 7 7m0-7-7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round"/></svg>
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5V12l3.5 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function Checkout({ order, onOrderChange, onBack, onContinue, submitting, paymentError, serverFieldErrors }) {
  const [form, setForm] = useState({ profile: '', name: '', email: '', document: '', whatsapp: '', agree: true })
  const [bumps, setBumps] = useState([])
  const [localErrors, setLocalErrors] = useState({})
  const fieldErrors = { ...serverFieldErrors, ...localErrors }
  const bumpOptions = [{ id:'likes', icon:'♡', quantity:'150', name:'Me Gustas MX', price:42 },{ id:'views', icon:'▷', quantity:'3,000', name:'Reproducciones en Reels', price:60 },{ id:'comments', icon:'○', quantity:'5', name:'Comentarios MX', price:60 }]
  const total = order.price + bumps.reduce((sum, item) => sum + item.price, 0)
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setLocalErrors((errors)=>({...errors,[event.target.name]:undefined})) }
  const submitCheckout = (event) => {
    event.preventDefault()
    const errors = {}
    if (!form.profile.trim()) errors.profile = 'Ingresa el @ o enlace del perfil de Instagram.'
    if (form.name.trim().length < 3) errors.name = 'Ingresa tu nombre completo.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Ingresa un correo electrónico válido.'
    if (!/^[A-Za-z0-9]{12,18}$/.test(form.document.trim())) errors.document = 'Ingresa un RFC (12–13 caracteres) o CURP (18 caracteres) válido.'
    if (!/^\d{10}$/.test(form.whatsapp)) errors.whatsapp = 'Ingresa un WhatsApp mexicano con 10 dígitos.'
    if (!form.agree) errors.agree = 'Debes aceptar los términos para continuar.'
    setLocalErrors(errors)
    if (!Object.keys(errors).length) onContinue({...form, bumps, total})
  }
  const toggleBump = (item) => setBumps((current) => current.some((b)=>b.id===item.id) ? current.filter((b)=>b.id!==item.id) : [...current,item])
  return <main className="checkout-page"><div className="checkout-title"><button onClick={onBack}>← Volver</button><h1>Finaliza tu pedido</h1><p>Completa tus datos para generar las instrucciones de pago.</p></div><div className="checkout-layout">
    <form className="checkout-form-card" onSubmit={submitCheckout} noValidate>
      <div className="profile-alert"><span>ⓘ Tu perfil debe estar público</span><small>¿Cómo hacer un pedido? ◯</small></div>
      <label className={fieldErrors.profile?'field-invalid':''}>@ del perfil o link de Instagram<input name="profile" value={form.profile} onChange={update} placeholder="@perfil o link de Instagram" aria-invalid={Boolean(fieldErrors.profile)} />{fieldErrors.profile && <small className="field-error">{fieldErrors.profile}</small>}</label>
      <label className={fieldErrors.name?'field-invalid':''}>Nombre completo <b>*</b><input name="name" value={form.name} onChange={update} placeholder="Tu nombre completo" aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}</label>
      <label className={fieldErrors.email?'field-invalid':''}>Correo electrónico <b>*</b><input name="email" type="email" value={form.email} onChange={update} placeholder="Tu correo electrónico" aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}</label>
      <label className={fieldErrors.document?'field-invalid':''}>RFC o CURP <b>*</b><input name="document" value={form.document} onChange={update} placeholder="PEPJ800101HDFRRL09" maxLength="18" aria-invalid={Boolean(fieldErrors.document)} />{fieldErrors.document ? <small className="field-error">{fieldErrors.document}</small> : <small>RFC (12–13 caracteres) o CURP (18 caracteres).</small>}</label>
      <label className={fieldErrors.whatsapp?'field-invalid':''}>WhatsApp (10 dígitos) <b>*</b><input name="whatsapp" value={form.whatsapp} onChange={(e) => {setForm({...form, whatsapp:e.target.value.replace(/\D/g,'').slice(0,10)});setLocalErrors((errors)=>({...errors,whatsapp:undefined}))}} inputMode="numeric" placeholder="55 1234 5678" aria-invalid={Boolean(fieldErrors.whatsapp)} />{fieldErrors.whatsapp ? <small className="field-error">{fieldErrors.whatsapp}</small> : <small>Para recibir actualizaciones de tu pedido.</small>}</label>
      <label className={fieldErrors.agree?'agree field-invalid':'agree'}><input type="checkbox" checked={form.agree} onChange={(e)=>{setForm({...form,agree:e.target.checked});setLocalErrors((errors)=>({...errors,agree:undefined}))}} /><span>Acepto los <a href="#terminos">términos de uso</a> y autorizo el procesamiento.{fieldErrors.agree && <small className="field-error">{fieldErrors.agree}</small>}</span></label>
      <section className="order-bumps"><div className="bumps-title"><span>🎁</span><div><h3>Ofertas Exclusivas</h3><small>Agrega más alcance a tu pedido</small></div><b>Opcional</b></div>{bumpOptions.map((item)=><button type="button" className={bumps.some((b)=>b.id===item.id)?'bump selected':'bump'} key={item.id} onClick={()=>toggleBump(item)}><span>{item.icon}</span><div><strong>{item.quantity}</strong><small>{item.name} 🇲🇽</small></div><em>MXN ${item.price}</em><b>{bumps.some((b)=>b.id===item.id)?'✓ Agregado':'Agregar'}</b></button>)}</section>
      <div className="final-summary"><div><span>{order.quantity} {order.label}</span><b>MXN ${order.price}.00</b></div>{bumps.map((item)=><div key={item.id}><span>+ {item.quantity} {item.name}</span><b>MXN ${item.price}.00</b></div>)}<div className="summary-total"><strong>Total:</strong><strong>MXN ${total}.00</strong></div></div>
      <div className="mobile-total"><span>Total</span><strong>MXN ${total}.00</strong></div>{paymentError && <div className="payment-error">{paymentError}</div>}<button className="spei-button" type="submit" disabled={submitting}>{submitting ? <><i className="button-spinner"/> GENERANDO COBRO...</> : <><VerifiedIcon/> PAGAR CON SPEI</>}</button>
      <div className="security-row"><span>🛡 Pago protegido</span><span>🔒 Datos protegidos</span><small>Esta demostración no transmite ni almacena tus datos.</small></div>
    </form>
    <aside className="order-card"><h2>Resumen del Pedido</h2><div className="order-product"><span className="big-quantity">{order.quantity}</span><p><span className="instagram-badge"><InstagramIcon size={16}/></span>{order.label}</p><div className="range-wrap"><input aria-label="Cantidad del paquete" type="range" min="0" max={order.options.length - 1} step="1" value={order.optionIndex} onChange={(e)=>onOrderChange(Number(e.target.value))} style={{'--range-progress':`${order.optionIndex / (order.options.length - 1) * 100}%`}}/><div><span>Min</span><small>Desliza para aumentar</small><span>Max</span></div></div><small>El valor cambia según la cantidad</small></div><div className="aside-extras">{bumps.map((item)=><span key={item.id}>+ {item.quantity} {item.name}</span>)}</div><div className="order-total"><span>Total:</span><strong>MXN ${total}.00</strong></div></aside>
  </div></main>
}

function Spei({ order, customer, payment, onBack }) {
  const [status, setStatus] = useState(payment.status || 'pending')
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState('')
  const copy = async (text, field) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(text))
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = String(text)
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        textarea.remove()
        if (!success) throw new Error('copy_failed')
      }
      setCopied(field)
      window.setTimeout(() => setCopied(''), 2000)
    } catch {
      setCopied('error')
      window.setTimeout(() => setCopied(''), 2500)
    }
  }
  const checkStatus = useCallback(async () => { setChecking(true); try { const response = await fetch(`${API_URL}/api/payments/${encodeURIComponent(payment.request_number)}/status`); const data = await response.json(); if (response.ok) setStatus(data.status) } finally { setChecking(false) } }, [payment.request_number])
  useEffect(() => { if (status !== 'pending') return undefined; const timer = setInterval(checkStatus, 10000); return () => clearInterval(timer) }, [status, checkStatus])
  const amount = payment.amount || customer.total || order.price
  const confirmed = ['confirmed','completed','paid','approved'].includes(status)
  const rejected = ['rejected','refused','failed','expired','cancelled'].includes(status)
  const statusName = confirmed ? 'PAGO CONFIRMADO' : rejected ? 'PAGO RECHAZADO' : 'PAGO PENDIENTE'
  const statusValue = confirmed ? 'Pago aprobado' : rejected ? 'Pago rechazado' : 'Pago pendiente'
  return <main className="spei-page"><div className="spei-card"><div className={`spei-icon ${confirmed?'confirmed':rejected?'rejected':'pending-status'}`}><PaymentStatusIcon status={status}/></div><span className={confirmed?'demo-badge confirmed':rejected?'demo-badge rejected':'demo-badge'}>{statusName}</span><h1>Transferencia SPEI</h1><p>Usa los datos siguientes desde la aplicación de tu banco.</p><div className="spei-amount"><small>Monto exacto</small><strong>MXN ${Number(amount).toFixed(2)}</strong></div><div className="bank-details">
    <label>Moneda<span>Pesos mexicanos (MXN)</span></label><label>ID del pedido<span>{payment.order_id}</span></label>
    <label>CLABE interbancaria<div><code>{payment.clabe}</code><button type="button" className={copied==='clabe'?'copied':''} onClick={()=>copy(payment.clabe,'clabe')}>{copied==='clabe'?'✓ Copiado':'Copiar'}</button></div></label>{payment.reference && <label>Referencia SPEI<div><code>{payment.reference}</code><button type="button" className={copied==='reference'?'copied':''} onClick={()=>copy(payment.reference,'reference')}>{copied==='reference'?'✓ Copiado':'Copiar'}</button></div></label>}<label>Estado del pago<span className={confirmed?'payment-state approved':rejected?'payment-state rejected':'payment-state awaiting'}><PaymentStatusIcon status={status} size={15}/>{statusValue}</span></label>
  </div>{copied==='error' && <div className="copy-error">No fue posible copiar automáticamente. Mantén presionado el dato para copiarlo.</div>}<div className={confirmed?'pending paid':rejected?'pending refused':'pending'}>{confirmed?<PaymentStatusIcon status={status} size={19}/>:rejected?<PaymentStatusIcon status={status} size={19}/>:<i/>}<div><b>{confirmed?'¡Pago aprobado!':rejected?'Pago rechazado':'Esperando confirmación'}</b><small>{confirmed?'Tu pedido está listo para ser procesado.':rejected?'No se confirmó el pago. Genera una nueva referencia o contacta a soporte.':'La confirmación puede tardar algunos minutos.'}</small></div></div><button className="verify" onClick={checkStatus} disabled={checking || confirmed || rejected}>{checking?'Verificando...':confirmed?'Pago aprobado':rejected?'Pago rechazado':'Verificar pago'}</button>{!confirmed && <button className="back-link" onClick={onBack}>← Volver a los datos</button>}<small className="spei-customer">Pedido para {customer.name} · {order.quantity} {order.label}</small></div></main>
}

function TrackOrder({ onBack }) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const search = async (event) => {
    event.preventDefault(); setError(''); setResult(null)
    if (!code.trim()) { setError('Ingresa el código de tu pedido.'); return }
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(code.trim())}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible consultar el pedido.')
      setResult(data)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  const statusInfo = { pending:['Pago pendiente','Esperando la confirmación de tu transferencia SPEI.','pending'], confirmed:['Pago confirmado','Tu pago fue confirmado y el pedido entrará en procesamiento.','confirmed'], completed:['Pedido concluido','Tu pedido fue procesado correctamente.','confirmed'], rejected:['Pago rechazado','La institución financiera rechazó este pago.','expired'], refused:['Pago rechazado','La institución financiera rechazó este pago.','expired'], failed:['Pago rechazado','No fue posible procesar este pago.','expired'], expired:['Pago vencido','La referencia SPEI de este pedido venció.','expired'] }
  const info = result ? (statusInfo[result.status] || [result.status,'El pedido está siendo actualizado.','pending']) : null
  return <main className="tracking-page"><div className="tracking-wrap"><button className="tracking-back" onClick={onBack}>← Volver al inicio</button><div className="tracking-card"><div className="tracking-icon">⌕</div><h1>Rastrear Pedido</h1><p>Ingresa el código recibido al generar tu pago SPEI.</p><form onSubmit={search} noValidate><label>Código del pedido<input value={code} onChange={(e)=>{setCode(e.target.value);setError('')}} placeholder="Ej.: 550e8400-e29b-41d4-a716..." aria-invalid={Boolean(error)} /></label>{error && <span className="tracking-error">{error}</span>}<button type="submit" disabled={loading}>{loading?'BUSCANDO...':'RASTREAR PEDIDO'}</button></form>{result && <section className={`tracking-result ${info[2]}`}><div className="tracking-status"><i><PaymentStatusIcon status={result.status} size={31}/></i><div><strong>{info[0]}</strong><span>{info[1]}</span></div></div><dl><div><dt>Pedido</dt><dd>{result.order_id}</dd></div><div><dt>Servicio</dt><dd>{result.quantity} {result.service}</dd></div><div><dt>Total</dt><dd>MXN ${Number(result.amount).toFixed(2)}</dd></div></dl></section>}<div className="tracking-help"><span>¿Necesitas ayuda?</span><a href={INVALID_WHATSAPP_URL} target="_blank" rel="noreferrer">◉ Soporte por WhatsApp</a><small>Número provisional no válido: +52 000 000 0000</small></div></div></div></main>
}

function App() {
  const [active, setActive] = useState('followers')
  const [menu, setMenu] = useState(false)
  const [notice, setNotice] = useState(true)
  const [step, setStep] = useState('catalog')
  const [order, setOrder] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [payment, setPayment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const current = services[active]
  const goTop = () => window.scrollTo(0, 0)
  const choosePackage = (quantity, price) => {
    const options = current.items.map(([q,p])=>({quantity:q,price:p}))
    setOrder({ quantity, price, label: current.label, options, optionIndex: options.findIndex((item)=>item.quantity===quantity) })
    setStep('checkout'); goTop()
  }
  const changeOrderOption = (index) => setOrder((currentOrder)=>({...currentOrder,...currentOrder.options[index],optionIndex:index}))
  const createSpeiPayment = async (data) => {
    setSubmitting(true); setPaymentError(''); setFieldErrors({})
    try {
      const response = await fetch(`${API_URL}/api/payments/spei`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ service:order.label, quantity:order.quantity, bumps:data.bumps, customer:data }) })
      const result = await response.json()
      if (!response.ok) { if (result.fields) setFieldErrors(result.fields); throw new Error(result.fields ? '' : (result.error || 'No fue posible generar el pago.')) }
      setCustomer(data); setPayment(result); setStep('spei'); goTop()
    } catch (error) { setPaymentError(error.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="site-shell">
      {notice && <div className="top-notice"><span>🔥 ¡OFERTA ESPECIAL! ENTREGA RÁPIDA EN TODO MÉXICO</span><button onClick={() => setNotice(false)}>×</button></div>}

      <header className={notice ? '' : 'at-top'}>
        <div className="header-content">
          <a className="logo brand-logo" href="#inicio" aria-label="Impulsa Tu Perfil"><img src="/brand/impulsa-tu-perfil.png" alt="Impulsa Tu Perfil" /></a>
          <nav className="desktop-nav"><a href="#servicios" onClick={()=>setStep('catalog')}><InstagramIcon size={18}/> Instagram</a><a href="#">♪ TikTok</a><a className="track" href="#rastrear" onClick={(e)=>{e.preventDefault();setStep('tracking');setMenu(false);goTop()}}>⌕ Rastrear Pedido</a><a className="support" href={INVALID_WHATSAPP_URL} target="_blank" rel="noreferrer">◉ Soporte Técnico</a></nav>
          <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu}><span>Menú</span><i className={menu ? 'open' : ''}><b/><b/><b/></i></button>
        </div>
        {menu && <nav className="mobile-nav"><a href="#servicios" onClick={()=>{setStep('catalog');setMenu(false)}}><InstagramIcon size={18}/> Instagram</a><a href="#">♪ TikTok</a><a className="track" href="#rastrear" onClick={(e)=>{e.preventDefault();setStep('tracking');setMenu(false);goTop()}}>⌕ Rastrear Pedido</a><a className="support" href={INVALID_WHATSAPP_URL} target="_blank" rel="noreferrer">◉ Soporte Técnico</a></nav>}
      </header>

      {step === 'catalog' && <main id="inicio">
        <section className="hero">
          <div className="hero-inner">
            <h1>Compra Seguidores<br/>y Me Gustas para tu<br/><span><InstagramIcon className="insta" size={43}/> Instagram</span></h1>
          </div>
          <div className="marquee left"><div>{['🔒 No pedimos tu contraseña','🛡️ Compra protegida y confidencial','🔒 No pedimos tu contraseña','🛡️ Compra protegida y confidencial','🔒 No pedimos tu contraseña'].map((x,i)=><span key={i}>{x}</span>)}</div></div>
          <div className="marquee right"><div>{['👥 No necesitas seguir a nadie','⚡ Entrega rápida','🎧 Soporte todos los días','👥 No necesitas seguir a nadie','⚡ Entrega rápida','🎧 Soporte todos los días'].map((x,i)=><span key={i}>{x}</span>)}</div></div>
        </section>

        <section className="services" id="servicios">
          <div className="section-heading"><h2>Nuestros Servicios</h2><p>Elige el paquete ideal para tu perfil</p></div>
          <div className="tabs">
            {[['followers','users','Seguidores'],['likes','heart','Me Gustas'],['views','play','Reproducciones Reels'],['comments','comment','Comentarios']].map(([key, icon, label]) => (
              <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}><Icon name={icon}/><span>{label}</span>{key !== 'views' && <MexicoFlag/>}</button>
            ))}
          </div>

          <div className="catalog-card">
            <h2><span className="instagram-badge"><InstagramIcon size={18}/></span>{current.title}</h2>
            <p>{current.description}</p>
            <div className="price-grid">
              {current.items.map(([quantity, price, usd, badge]) => (
                <button className="price-card" key={quantity} onClick={() => choosePackage(quantity, price)}>
                  {badge && <span className={badge === 'Más vendido' ? 'badge hot' : 'badge'}>{badge}</span>}
                  <div><strong>{quantity}</strong><small>{current.label}</small></div>
                  <div className="price"><strong>MXN ${price}</strong><small>{usd}</small></div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="why">
          <div className="section-heading"><h2>¿Por qué elegir Impulsa Tu Perfil?</h2><p>Una experiencia simple y directa</p></div>
          <div className="why-grid"><article><span>◷</span><h3>Experiencia comprobada</h3><p>Procesamiento claro para cada pedido.</p></article><article><span>★</span><h3>Servicios seleccionados</h3><p>Opciones pensadas para cada objetivo.</p></article><article><span>◉</span><h3>Soporte diario</h3><p>Estamos disponibles cuando nos necesites.</p></article></div>
        </section>
      </main>}
      {step === 'checkout' && <Checkout order={order} onOrderChange={changeOrderOption} onBack={()=>{setStep('catalog');goTop()}} onContinue={createSpeiPayment} submitting={submitting} paymentError={paymentError} serverFieldErrors={fieldErrors} />}
      {step === 'spei' && <Spei order={order} customer={customer} payment={payment} onBack={()=>{setStep('checkout');goTop()}} />}
      {step === 'tracking' && <TrackOrder onBack={()=>{setStep('catalog');goTop()}} />}

      <footer><div className="logo light brand-logo"><img src="/brand/impulsa-tu-perfil.png" alt="Impulsa Tu Perfil" /></div><p>© 2026 Impulsa Tu Perfil. No afiliado a Instagram o Meta.</p></footer>
    </div>
  )
}

export default App
