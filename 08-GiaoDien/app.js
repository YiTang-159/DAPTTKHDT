/* PHÒNG KHÁM ĐA KHOA – LOGIC TRÌNH DIỄN GIAO DIỆN
   Dữ liệu minh họa lưu trong localStorage, không có backend hay xác thực an toàn.
*/
'use strict';
const $ = id => document.getElementById(id);
const STORE = 'clinic_demo_v2';
const ROLES = {
  bn: {name:'Bệnh nhân', pages:[2,3]},
  lt: {name:'Lễ tân', pages:[2,3,4]},
  bs: {name:'Bác sĩ', pages:[4,5,6]},
  ktv:{name:'Kỹ thuật viên xét nghiệm',pages:[5]},
  tn: {name:'Thu ngân',pages:[7]},
  ql: {name:'Quản lý phòng khám',pages:[8]}
};
const PAGE_NAMES = ['','Đăng nhập','Đặt lịch khám','Lịch hẹn','Danh sách chờ khám','Khám bệnh và xét nghiệm','Kê đơn thuốc','Thanh toán và hóa đơn','Quản trị và phân quyền'];
const FILES = ['','GD01_DangNhap.html','GD02_DatLich.html','GD03_LichHenCuaToi.html','GD04_DanhSachChoKham.html','GD05_KhamBenh.html','GD06_KeDonThuoc.html','GD07_ThanhToanHoaDon.html','GD08_QuanTriPhanQuyen.html'];
const ICONS = ['','🔐','📅','📋','⏳','🩺','💊','🧾','⚙️'];
const DESCS = ['','Đăng nhập để truy cập các chức năng theo vai trò.','Xem lịch bác sĩ và lựa chọn khung giờ trống.','Theo dõi trạng thái, đổi lịch và hủy lịch khám.','Tiếp đón bệnh nhân và chuyển lượt khám đến bác sĩ.','Ghi khám lâm sàng, xử lý chỉ định xét nghiệm.','Kiểm tra danh mục thuốc, dị ứng và phát hành đơn.','Tính chi phí, thanh toán và in phiếu thu mẫu.','Tài khoản, vai trò, nhật ký, thông báo và báo cáo.'];
const DOCTORS = {'Nội tổng quát':['BS. Trần Minh Khoa','BS. Lê Thu Hà'],'Tim mạch':['BS. Phạm Quốc Bảo'],'Nhi':['BS. Nguyễn Lan Anh']};
const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30'];
const PATIENT = {id:'BN-0001',name:'Nguyễn Văn An',dob:'12/05/1995',allergy:'Penicillin'};
const LABS = [{id:'M',name:'Xét nghiệm máu',price:120000},{id:'S',name:'Siêu âm',price:200000},{id:'X',name:'X-quang',price:180000}];
const MEDICINES = [
  {id:'P',name:'Paracetamol 500mg',price:2000,allergy:'',active:true},
  {id:'A',name:'Amoxicillin 500mg',price:5000,allergy:'Penicillin',active:true},
  {id:'L',name:'Loratadin 10mg',price:3000,allergy:'',active:true},
  {id:'O',name:'Omeprazol 20mg',price:4000,allergy:'',active:true},
  {id:'C',name:'Cefaclor 250mg',price:6000,allergy:'',active:false}
];
const RESERVED = ['Chờ xác nhận','Đã đặt','Đã đến','Hoàn thành'];
const CAN_CHANGE = ['Chờ xác nhận','Đã đặt'];
const LAB_STATES = {ORDERED:'Đã chỉ định',SAMPLE_COLLECTED:'Đã lấy mẫu',IN_PROGRESS:'Đang thực hiện',RESULT_AVAILABLE:'Có kết quả',REVIEWED:'Bác sĩ đã xem',CANCELLED:'Đã hủy'};
const shortDate = d => {const dt=new Date(d.getTime()-d.getTimezoneOffset()*60000);return dt.toISOString().slice(0,10)};
const TODAY = shortDate(new Date());
const tomorrow = shortDate(new Date(Date.now()+86400000));
const money = n => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(n)||0);
const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateVI = iso => iso ? iso.split('-').reverse().join('/') : '—';
const stamp = () => new Date().toLocaleString('vi-VN');
const roleName = role => ROLES[role]?.name || 'Khách';
function seed() {
  return {v:2,role:null,user:null,flash:'',
    accounts:Object.keys(ROLES).map((r,i)=>({u:`user${i+1}`,role:r,locked:false})),
    draft:{spec:'Nội tổng quát',doctor:DOCTORS['Nội tổng quát'][0],date:tomorrow,time:'',reason:'',editId:null},
    ap:[{id:'LH001',patientId:PATIENT.id,doctor:DOCTORS['Nội tổng quát'][0],spec:'Nội tổng quát',date:TODAY,time:'08:30',reason:'Khám tổng quát',status:'Đã đặt',createdAt:stamp()}],
    nextAp:2,visits:{},activeVisit:null,nextLab:1,invoices:[],nextInvoice:1,
    sms:[],logs:[],tab:'accounts',filter:'Tất cả',paymentMethod:'Tiền mặt',paymentFail:false,cash:'',smsFail:false
  };
}
let s;
try{s=JSON.parse(localStorage.getItem(STORE))}catch(_){s=null}
if(!s || s.v!==2){s=seed();save()}
function save(){try{localStorage.setItem(STORE,JSON.stringify(s))}catch(_){}}
function account(){return s.accounts.find(a=>a.u===s.user)}
function validSession(){const a=account();return !!(a&&!a.locked&&ROLES[a.role]&&a.role===s.role)}
function audit(action,subject=''){s.logs.unshift({at:stamp(),who:s.user||'Chưa đăng nhập',role:roleName(s.role),action,subject});s.logs=s.logs.slice(0,180)}
function notify(message){const box=$('toast');if(!box)return;box.textContent=message;box.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>{box.hidden=true},3400)}
function go(page,message=''){if(message)s.flash=message;save();window.location.href=FILES[page]}
function signOut(){audit('Đăng xuất');s.role=null;s.user=null;s.activeVisit=null;go(1,'Đã đăng xuất')}
function msgBox(text,type='info'){return `<div class="notice ${type}" role="status">${escapeHTML(text)}</div>`}
function pill(status){const cls=['Đã hủy','Không đến','CANCELLED','Thất bại'].includes(status)?'bad':['Chờ xác nhận','Danh sách chờ','Chờ gửi lại'].includes(status)?'pending':['Hoàn thành','Đã đến','Đã đặt','REVIEWED','Đã gửi','Đã thanh toán'].includes(status)?'good':'neutral';return `<span class="pill ${cls}">${escapeHTML(status)}</span>`}
function empty(text){return `<div class="empty">${escapeHTML(text)}</div>`}
function options(arr,sel){return arr.map(x=>`<option value="${escapeHTML(x)}" ${x===sel?'selected':''}>${escapeHTML(x)}</option>`).join('')}
function isTaken(doctor,date,time,excludeId=null){return s.ap.some(a=>a.id!==excludeId&&a.doctor===doctor&&a.date===date&&a.time===time&&RESERVED.includes(a.status))}
function canPage(page){return s.role&&ROLES[s.role]?.pages.includes(page)}
function apById(id){return s.ap.find(x=>x.id===id)}
function visitFor(id){return s.visits[id]}
function currentVisit(){return s.activeVisit ? visitFor(s.activeVisit) : null}
function activeAp(){return s.activeVisit ? apById(s.activeVisit) : null}
function createVisit(id){if(!s.visits[id])s.visits[id]={id,symptoms:'',diagnosis:'',labs:[],rx:[],rxIssued:false,closed:false,followup:''};return s.visits[id]}
function sendSMS(id){s.sms.unshift({id,at:stamp(),status:s.smsFail?'Chờ gửi lại':'Đã gửi'})}
function createAppointment(d,status='Chờ xác nhận') {const id='LH'+String(s.nextAp++).padStart(3,'0');const a={id,patientId:PATIENT.id,doctor:d.doctor,spec:d.spec,date:d.date,time:d.time,reason:d.reason.trim()||'Khám sức khỏe',status,createdAt:stamp()};s.ap.unshift(a);audit('Tạo lịch hẹn',id);return a}
function promoteWaitlist(doctor,date,time) {if(isTaken(doctor,date,time))return;const a=s.ap.find(x=>x.doctor===doctor&&x.date===date&&x.time===time&&x.status==='Danh sách chờ');if(a){a.status='Chờ xác nhận';sendSMS(a.id);audit('Chuyển danh sách chờ',a.id)}}
function invoiceFor(id){return s.invoices.find(x=>x.appointmentId===id)}
function billLines(id){const v=visitFor(id);if(!v)return[];const lines=[{name:'Phí khám',price:150000}];for(const l of v.labs)if(l.status!=='CANCELLED'){const test=LABS.find(x=>x.id===l.type);if(test)lines.push({name:test.name,price:test.price})}for(const r of v.rx){const m=MEDICINES.find(x=>x.id===r.medId);if(m)lines.push({name:`${m.name} × ${r.qty}`,price:m.price*r.qty})}return lines}
function total(lines){return lines.reduce((sum,x)=>sum+x.price,0)}
function steps(){const a=s.ap.some(x=>!['Đã hủy','Không đến','Danh sách chờ'].includes(x.status));const q=s.ap.some(x=>x.status==='Đã đến'||x.status==='Hoàn thành');const done=Object.values(s.visits).some(v=>v.closed);const rx=Object.values(s.visits).some(v=>v.rxIssued);const paid=s.invoices.some(x=>x.status==='Đã thanh toán');const data=[a,q,done,rx,paid];return '<div class="steps">'+['Đặt lịch','Tiếp đón','Khám bệnh','Kê đơn','Thanh toán'].map((x,i)=>`<span class="${data[i]?'done':''}">${data[i]?'✓':i+1}. ${x}</span>`).join('')+'</div>'}
let PAGE=1,VIEW=()=>'';
function layout(page,view){PAGE=page;VIEW=view;
  if(page!==1&&!validSession()){s.role=null;s.user=null;save();window.location.replace(FILES[1]);return}
  if(page!==1&&!canPage(page)){go(ROLES[s.role].pages[0],'Vai trò hiện tại không được truy cập màn hình này');return}
  const pages=s.role&&validSession()?ROLES[s.role].pages:[];
  document.body.innerHTML=`<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">✚</span><div><strong>PHÒNG KHÁM ĐA KHOA</strong><small>Hệ thống đặt lịch và quản lý khám bệnh</small></div></div><div class="session">${s.role?`<span class="user-label">${escapeHTML(s.user)} · ${escapeHTML(roleName(s.role))}</span><button class="btn-ghost" onclick="signOut()">Đăng xuất</button>`:'<span class="user-label">Chưa đăng nhập</span>'}</div></header>
    <aside class="sidebar"><p class="sidebar-title">ĐIỀU HƯỚNG</p>${(s.role?[...pages]:[1]).map(i=>`<a href="${FILES[i]}" class="${i===page?'active':''}"><span aria-hidden="true">${ICONS[i]}</span>${PAGE_NAMES[i]}</a>`).join('')}</aside>
    <main class="content"><div class="crumb">PHÒNG KHÁM / ${escapeHTML(PAGE_NAMES[page])}</div><div id="main"></div><footer class="footnote">Hệ thống quản lý phòng khám đa khoa · Đặt lịch, khám bệnh và thanh toán</footer></main><div id="toast" role="status" aria-live="polite" hidden></div>`;
  render();if(s.flash){const msg=s.flash;s.flash='';save();notify(msg)}
}
function render(){const elem=$('main');if(!elem)return;let h='';try{h=VIEW()}catch(e){console.error(e);h=msgBox('Không tải được màn hình. Vui lòng tải lại trang.','error')}
  elem.innerHTML=`<div class="page-title"><div><h1>${escapeHTML(PAGE_NAMES[PAGE])}</h1><p>${escapeHTML(DESCS[PAGE])}</p></div></div>${PAGE>1&&PAGE<8?steps():''}${h}`;
}
function resetData(){if(!confirm('Khôi phục dữ liệu mẫu? Tất cả thao tác đã lưu sẽ bị xóa.'))return;localStorage.removeItem(STORE);s=seed();save();go(1,'Đã khôi phục dữ liệu mẫu')}
