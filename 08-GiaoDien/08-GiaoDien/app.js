const $=id=>document.getElementById(id);
const ROLES={all:{n:'Demo – xem tất cả',s:[1,2,3,4,5,6,7,8]},bn:{n:'Bệnh nhân',s:[2,3]},lt:{n:'Lễ tân',s:[2,3,4]},bs:{n:'Bác sĩ',s:[4,5,6]},ktv:{n:'KTV xét nghiệm',s:[5]},tn:{n:'Thu ngân',s:[7]},ql:{n:'Quản lý phòng khám',s:[8]}};
const NAMES=['','Đăng nhập','Đặt lịch','Lịch hẹn của tôi','Danh sách chờ','Khám và bệnh án','Kê đơn thuốc','Thanh toán','Quản trị'];
const FILES=['','GD01_DangNhap','GD02_DatLich','GD03_LichHenCuaToi','GD04_DanhSachChoKham','GD05_KhamBenh','GD06_KeDonThuoc','GD07_ThanhToanHoaDon','GD08_QuanTriPhanQuyen'].map(f=>f&&f+'.html');
const IC=['','🔐','📅','🗂️','⏳','🩺','💊','💳','⚙️'];
const SUB=['','Truy cập hệ thống theo vai trò được phân quyền.','Chọn bác sĩ và khung giờ còn trống, hệ thống giữ chỗ và gửi SMS xác nhận.','Theo dõi, xác nhận, đổi hoặc hủy lịch hẹn; check-in khi bệnh nhân đến.','Bệnh nhân đã check-in, sắp theo thứ tự đến.','Ghi triệu chứng, chẩn đoán và chỉ định xét nghiệm song song.','Kê đơn có kiểm tra danh mục thuốc và cảnh báo dị ứng.','Tổng hợp chi phí khám, xét nghiệm, thuốc và thanh toán qua cổng.','Tài khoản, phân quyền, lịch bác sĩ, nhật ký truy cập và báo cáo.'];
const DOC={'Nội tổng quát':['BS. Trần Minh Khoa','BS. Lê Thu Hà'],'Tim mạch':['BS. Phạm Quốc Bảo'],'Nhi':['BS. Nguyễn Lan Anh']};
const T=['08:00','08:30','09:00','09:30','10:00','10:30'];
const MED=[['Paracetamol 500mg',2000,''],['Amoxicillin 500mg',5000,'Penicillin'],['Loratadin 10mg',3000,''],['Omeprazol 20mg',4000,''],['Cefaclor 250mg (ngừng cung cấp)',6000,'x']];
const LAB=[['Xét nghiệm máu',120000],['Siêu âm',200000],['X-quang',180000]];
const LST=['Đã chỉ định','Đã lấy mẫu','Đang thực hiện','Có kết quả','Bác sĩ đã xem'];
const PT={name:'Nguyễn Văn An',id:'BN-0001',dob:'12/05/1995',allergy:'Penicillin'};
const d1=new Date(Date.now()+864e5).toISOString().slice(0,10);
let s=null;try{s=JSON.parse(localStorage.getItem('pk'))}catch(e){}
function save(){try{localStorage.setItem('pk',JSON.stringify(s))}catch(e){}}
const k=a=>a.doc+a.date+a.time,fmt=n=>n.toLocaleString('vi-VN')+' đ',kt=()=>['all','ktv'].includes(s.role);
const opts=(l,v)=>l.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('');
function addAp(doc,spec,date,time,reason,st){const a={id:'LH'+(++s.n),doc,spec,date,time,reason,st};s.ap.push(a);s.taken[k(a)]=1;return a}
if(!s){s={role:null,b:{spec:'Nội tổng quát',doc:'BS. Trần Minh Khoa',date:d1,slot:'',reason:'',re:null},taken:{},ap:[],q:[],cur:null,labs:[],sym:'',dx:'',locked:false,rx:[],rxOk:false,warn:null,pm:'Tiền mặt',fail:false,pst:'',paid:false,logs:[],tab:'tk',flt:'Tất cả',raced:false,n:0,ver:[],sms:[],smsFail:false,fu:'',cash:'',msg:'',US:Object.keys(ROLES).slice(1).map((r,i)=>({u:'user'+(i+1),r,lock:false}))};
 addAp('BS. Trần Minh Khoa','Nội tổng quát',d1,'08:30','Đau đầu kéo dài','Đã đặt');save()}
const bk=(d,dt,t)=>s.taken[d+dt+t]||(d.length+dt.charCodeAt(9)+t.charCodeAt(1))%5==0;
function log(a,o){s.logs.unshift({t:new Date().toLocaleTimeString('vi-VN'),r:s.role?ROLES[s.role].n:'—',a,o})}
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.display='none',2800)}
function nav(n,msg){s.msg=msg||'';save();location.href=FILES[n]}
function promote(){const w=s.ap.find(a=>a.st=='Danh sách chờ'&&!s.taken[k(a)]);if(w){w.st='Chờ xác nhận';s.taken[k(w)]=1;save();toast('Có chỗ trống: lịch trong danh sách chờ chuyển sang Chờ xác nhận')}}
function lines(){const a=s.ap.find(x=>x.id==s.cur),L=a?[['Phí khám',150000]]:[];s.labs.filter(l=>!l.x).forEach(l=>L.push([l.n,l.p]));s.rx.forEach(r=>L.push([MED[r.i][0]+' × '+r.q,MED[r.i][1]*r.q]));return L}
function stp(){const dn=[s.ap.some(x=>x.st!='Đã hủy'),s.q.length>0,s.locked,s.rxOk,s.paid],cu=dn.indexOf(false);return '<div class="stp">'+['Đặt lịch','Check-in','Khám bệnh','Kê đơn','Thanh toán'].map((t,i)=>`<div data-n="${i+1}" class="${dn[i]?'ok':i==cu?'cu':''}">${t}</div>`).join('')+'</div>'}
let PAGE=1,VIEW=null;
function layout(n,fn){PAGE=n;VIEW=fn;const al=ROLES[s.role||'all'].s;
 if(n>1&&!s.role)return location.replace(FILES[1]);if(n>1&&!al.includes(n))return location.replace(FILES[al[0]]);
 document.body.innerHTML='<header><b>🏥 Phòng khám đa khoa</b><small>Đặt lịch khám và quản lý hồ sơ bệnh án</small><span class="w">'+(s.role?'Vai trò: '+ROLES[s.role].n:'Chưa đăng nhập')+'</span>'+(s.role?'<button onclick="s.role=null;nav(1)">Đăng xuất</button>':'')+'</header><nav>'+(s.role?[1,...al.filter(x=>x!=1)]:[1]).map(i=>`<a class="${i==n?'on':''}" href="${FILES[i]}"><span>${IC[i]}</span>${i}. ${NAMES[i]}</a>`).join('')+'</nav><main id="m"></main><div id="toast"></div>';
 render();if(s.msg){toast(s.msg);s.msg='';save()}}
function render(){const h=VIEW();$('m').innerHTML='<div class="crumb">Trang chủ / '+NAMES[PAGE]+'</div>'+h.replace('</h2>','</h2><p class="sub">'+SUB[PAGE]+'</p>'+(PAGE>1&&PAGE<8?stp():'')+(PAGE==8?kpi():''))}
