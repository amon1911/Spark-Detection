import streamlit as st
import pandas as pd
import requests
import time
import plotly.express as px
from datetime import datetime

# --- CONFIG ---
API_URL = "http://localhost:8000/api"
REFRESH_RATE = 2  # Refresh เร็วขึ้นเป็น 2 วิ

st.set_page_config(
    page_title="Machine Monitor",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- CSS STYLING ---
st.markdown("""
    <style>
    .stApp { background-color: #0e1117; }
    .status-card {
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-weight: bold;
        color: white;
        font-size: 3em;
        margin-bottom: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    </style>
""", unsafe_allow_html=True)

# --- HELPER FUNCTIONS ---
def fetch_data(endpoint):
    try:
        r = requests.get(f"{API_URL}/{endpoint}")
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        return None
    return None

def format_time(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"

# --- MAIN APP ---
st.title("🏭 Spark Detection Monitor (Real-time)")

# Container หลักที่จะ Refresh ตลอดเวลา
placeholder = st.empty()

while True:
    # 1. ดึงสถานะปัจจุบัน
    state_data = fetch_data("state")
    
    # 2. ดึงประวัติรอบการทำงานของ "วันนี้"
    today_str = datetime.now().strftime("%Y-%m-%d")
    cycles_data = fetch_data(f"cycles?date={today_str}")
    
    with placeholder.container():
        if state_data:
            # --- SECTION 1: STATUS CARD ---
            status = state_data['state']
            # ถ้า RUN สีเขียว, STOP สีแดง
            bg_color = "#28a745" if status == "RUN" else "#dc3545"
            
            st.markdown(f"""
                <div class="status-card" style="background-color: {bg_color};">
                    {status}
                </div>
            """, unsafe_allow_html=True)

            # --- SECTION 2: KPI METRICS ---
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Cycles Today", value=state_data['current_cycle'])
            with c2:
                st.metric("Runtime Today", value=format_time(state_data['today_runtime_sec']))
            with c3:
                # คำนวณ Availability แบบง่ายๆ (เทียบกับเวลาปัจจุบันตั้งแต่เที่ยงคืน)
                now_sec = (datetime.now() - datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds()
                avail = (state_data['today_runtime_sec'] / now_sec * 100) if now_sec > 0 else 0
                st.metric("Availability (%)", value=f"{avail:.1f}%")

            # --- SECTION 3: TIMELINE CHART (ของจริง!) ---
            st.subheader("📊 Machine Activity Timeline (Today)")

            if cycles_data and len(cycles_data) > 0:
                # แปลงข้อมูลจาก API ให้เป็น Format ที่กราฟเข้าใจ
                timeline_list = []
                for cycle in cycles_data:
                    timeline_list.append({
                        "Task": "Machine",
                        "Start": cycle['start_time'],
                        "Finish": cycle['stop_time'],
                        "Status": "RUN"
                    })
                
                # สร้างกราฟ
                df_chart = pd.DataFrame(timeline_list)
                fig = px.timeline(df_chart, x_start="Start", x_end="Finish", y="Task", color="Status",
                                  color_discrete_map={"RUN": "#28a745"}, # สีเขียว
                                  height=200)
                
                fig.update_yaxes(visible=False) # ซ่อนแกน Y ให้ดูสะอาด
                fig.layout.xaxis.type = 'date'  # บังคับแกน X เป็นเวลา
                
                # ใส่ key=time.time() เพื่อแก้ Error: DuplicateElementId
                st.plotly_chart(fig, use_container_width=True, key=f"chart_{time.time()}")
            else:
                st.info("⏳ ยังไม่มีรอบการทำงาน (Waiting for first RUN cycle)...")

        else:
            st.error("⚠️ Cannot connect to Backend API (Check if main.py is running)")

    # หน่วงเวลา 2 วินาที ก่อนวนลูปใหม่
    time.sleep(REFRESH_RATE)