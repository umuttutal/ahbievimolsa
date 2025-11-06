const { useState, useEffect, useRef } = React;

const EvYatirimAnalizi = () => {
  // Kullanıcı değiştirilebilir parametreler
  const [yuzYilArtisOrani, setYuzYilArtisOrani] = useState(30);
  const [yapracikArtisOrani, setYapracikArtisOrani] = useState(20);
  const [yapracikKira2027, setYapracikKira2027] = useState(11000);
  const [faiz2027, setFaiz2027] = useState(1.5);
  const [vade, setVade] = useState(60);
  const [ekstraPara, setEkstraPara] = useState(600000);
  const [firsatMaliyet, setFirsatMaliyet] = useState(45);

  // Sabit parametreler
  const vars = {
    yapracikDeger2026: 2700000,
    yapracikDeger2027: 2700000 * (1 + yapracikArtisOrani / 100),
    yapracikKira: 11000,
    yuzYilDeger2026: 4300000,
    yuzYilDeger2027: 4300000 * (1 + yuzYilArtisOrani / 100),
    suankiKira: 23000,
    kira2027: 30000,
    ekstraPara: ekstraPara,
    krediTutar: 1000000,
    faiz2026: 2.7,
    faiz2027: faiz2027,
    vade: vade,
    firsatMaliyet: firsatMaliyet,
    yapracikKira2027: yapracikKira2027
  };

  // Aylık taksit hesaplama
  const hesaplaAylikTaksit = (anapara, aylikFaiz, vade) => {
    const r = aylikFaiz / 100;
    return (anapara * r * Math.pow(1 + r, vade)) / (Math.pow(1 + r, vade) - 1);
  };

  // Senaryo 1: 2026 Ocak'ta al
  const senaryo1_krediTutar = vars.yuzYilDeger2026 - vars.yapracikDeger2026 - vars.ekstraPara;
  const senaryo1_aylikTaksit = hesaplaAylikTaksit(senaryo1_krediTutar, vars.faiz2026, vars.vade);
  
  // Senaryo 2: 2027 Ocak'ta al
  const ekstraParaBuyumus = vars.ekstraPara * (1 + vars.firsatMaliyet / 100);
  const senaryo2_krediTutar = vars.yuzYilDeger2027 - vars.yapracikDeger2027 - ekstraParaBuyumus;
  const senaryo2_aylikTaksit = hesaplaAylikTaksit(senaryo2_krediTutar, vars.faiz2027, vars.vade);

  // Senaryo 1 nakit akışı analizi
  const senaryo1NakitAkisi = [];
  let senaryo1KumulatifMaliyet = 0;
  
  for (let ay = 0; ay <= vade; ay++) {
    let aylikMaliyet = 0;
    
    if (ay === 0) {
      // İlk ay: Satış ve alım (2026 Ocak)
      aylikMaliyet = vars.yuzYilDeger2026 - vars.yapracikDeger2026 - vars.ekstraPara;
      senaryo1KumulatifMaliyet = aylikMaliyet;
    } else {
      // Taksit ödemeleri
      aylikMaliyet = senaryo1_aylikTaksit;
    }
    
    if (ay > 0) {
      senaryo1KumulatifMaliyet += aylikMaliyet;
    }
    
    if (ay % 6 === 0) {
      senaryo1NakitAkisi.push({
        ay: ay,
        yil: 2026 + Math.floor(ay / 12),
        kumulatif: Math.round(senaryo1KumulatifMaliyet),
        aylik: Math.round(aylikMaliyet)
      });
    }
  }

  // Senaryo 2 nakit akışı analizi
  const senaryo2NakitAkisi = [];
  let senaryo2KumulatifMaliyet = 0;
  
  for (let ay = 0; ay <= vade; ay++) {
    let aylikMaliyet = 0;
    
    if (ay < 12) {
      // 2026: Kira öde + Kira al + Fırsat maliyeti kaybı
      const netKira = vars.suankiKira - vars.yapracikKira2027;
      const firsatKaybi = (vars.ekstraPara * (vars.firsatMaliyet / 100)) / 12;
      aylikMaliyet = netKira + firsatKaybi;
    } else if (ay === 12) {
      // 2027 Ocak: Satış ve alım
      const ekstraParaBuyumus = vars.ekstraPara * (1 + vars.firsatMaliyet/100);
      aylikMaliyet = vars.yuzYilDeger2027 - vars.yapracikDeger2027 - ekstraParaBuyumus;
    } else {
      // 2027 sonrası: Sadece taksit
      aylikMaliyet = senaryo2_aylikTaksit;
    }
    
    senaryo2KumulatifMaliyet += aylikMaliyet;
    
    if (ay % 6 === 0) {
      senaryo2NakitAkisi.push({
        ay: ay,
        yil: 2026 + Math.floor(ay / 12),
        kumulatif: Math.round(senaryo2KumulatifMaliyet),
        aylik: Math.round(aylikMaliyet)
      });
    }
  }

  // Net bugünkü değer hesaplama (enflasyon düzeltmeli)
  const enflasyonOrani = 0.30 / 12; // Aylık %2.5
  const hesaplaNBD = (nakitAkisi) => {
    return nakitAkisi.reduce((toplam, item) => {
      return toplam + item.aylik / Math.pow(1 + enflasyonOrani, item.ay);
    }, 0);
  };

  const senaryo1NBD = hesaplaNBD(senaryo1NakitAkisi);
  const senaryo2NBD = hesaplaNBD(senaryo2NakitAkisi);

  // Toplam maliyet hesapları (5 yıl)
  const senaryo1Toplam = senaryo1NakitAkisi[senaryo1NakitAkisi.length - 1].kumulatif;
  const senaryo2Toplam = senaryo2NakitAkisi[senaryo2NakitAkisi.length - 1].kumulatif;

  // Karşılaştırma grafiği için veri
  const karsilastirmaData = senaryo1NakitAkisi.map((item, index) => ({
    ay: item.ay,
    yil: item.yil,
    senaryo1Aylik: item.aylik,  // Aylık maliyet - grafik için
    senaryo2Aylik: senaryo2NakitAkisi[index].aylik,
    senaryo1: item.kumulatif,  // Kümülatif - tablo için
    senaryo2: senaryo2NakitAkisi[index].kumulatif
  }));

  // Yapracık değer artışı hesapla
  const yapracikDegerArtisi = vars.yapracikDeger2027 - vars.yapracikDeger2026;
  const yapracikArtisYuzdesi = ((yapracikDegerArtisi / vars.yapracikDeger2026) * 100).toFixed(0);

  // ApexCharts referansı
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && typeof ApexCharts !== 'undefined') {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const options = {
        series: [{
          name: "2026'da Al - Aylık Maliyet",
          data: karsilastirmaData.map(d => d.senaryo1Aylik)
        }, {
          name: "2027'de Al - Aylık Maliyet",
          data: karsilastirmaData.map(d => d.senaryo2Aylik)
        }],
        chart: {
          height: 400,
          type: 'area',
          toolbar: { show: false },
          stacked: false
        },
        colors: ['#10b981', '#8b5cf6'],
        dataLabels: { enabled: false },
        stroke: {
          curve: 'straight',  // Lineer interpolasyon
          width: 2
        },
        markers: {
          size: 4,
          hover: { size: 6 }
        },
        xaxis: {
          categories: karsilastirmaData.map(d => d.yil),
          title: { text: 'Zaman (Yıl)' }
        },
        yaxis: {
          title: { text: 'Aylık Maliyet (₺)' },
          labels: {
            formatter: function (value) {
              return (value / 1000).toFixed(0) + 'K ₺';
            }
          }
        },
        tooltip: {
          shared: false,
          y: {
            formatter: function (value) {
              return value.toLocaleString('tr-TR') + ' ₺/ay';
            }
          }
        },
        fill: {
          type: 'solid',
          opacity: 0.3
        },
        legend: {
          position: 'top',
          horizontalAlign: 'center'
        }
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [yuzYilArtisOrani, yapracikArtisOrani, yapracikKira2027, faiz2027, vade, ekstraPara, firsatMaliyet]);

  // Vade yılı hesapla
  const vadeYil = vade / 12;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-4xl">🏠</span>
          Ev Yatırım Fizibilite Analizi
        </h1>
        <p className="text-gray-600">İki farklı senaryonun karşılaştırmalı analizi</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Senaryo 1: 2026 Ocak'ta Al</h3>
            <span className="text-3xl opacity-80">📅</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-green-100 text-sm">100.Yıl Ev Fiyatı</p>
              <p className="text-2xl font-bold">{vars.yuzYilDeger2026.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Yapracık Satış</p>
              <p className="text-xl font-bold">{vars.yapracikDeger2026.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Kredi Tutarı</p>
              <p className="text-xl font-bold">{senaryo1_krediTutar.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-green-100 text-sm">Aylık Taksit ({vade} ay, %2.7)</p>
              <p className="text-xl font-bold">{Math.round(senaryo1_aylikTaksit).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="border-t border-green-400 pt-3 mt-3">
              <p className="text-green-100 text-sm">{vadeYil} Yıllık Toplam Maliyet</p>
              <p className="text-2xl font-bold">{senaryo1Toplam.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Senaryo 2: 2027 Ocak'ta Al</h3>
            <span className="text-3xl opacity-80">📅</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-purple-100 text-sm">100.Yıl Ev Fiyatı (+%30)</p>
              <p className="text-2xl font-bold">{Math.round(vars.yuzYilDeger2027).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Yapracık Satış (+%{yapracikArtisYuzdesi})</p>
              <p className="text-xl font-bold">{Math.round(vars.yapracikDeger2027).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Ekstra Para Büyümüş</p>
              <p className="text-lg font-bold">{Math.round(ekstraParaBuyumus).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Kredi Tutarı</p>
              <p className="text-xl font-bold">{Math.round(senaryo2_krediTutar).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Aylık Taksit ({vade} ay, %{faiz2027})</p>
              <p className="text-xl font-bold">{Math.round(senaryo2_aylikTaksit).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="border-t border-purple-400 pt-3 mt-3">
              <p className="text-purple-100 text-sm">{vadeYil} Yıllık Toplam Maliyet</p>
              <p className="text-2xl font-bold">{senaryo2Toplam.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aylık Maliyet Grafiği */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Aylık Maliyet Karşılaştırması ({vadeYil} Yıl)</h3>
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-gray-700">
            <strong>Toplam Maliyet = Alan Altındaki Toplam (∫ Aylık Maliyet dt)</strong>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Grafik her noktada aylık maliyeti gösterir. Alan = Toplam {vadeYil} yıllık maliyet
          </p>
        </div>
        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white font-bold">∫</div>
            <div>
              <p className="text-xs text-gray-600">Senaryo 1 Toplam Maliyet (Alan)</p>
              <p className="text-lg font-bold text-green-700">{senaryo1Toplam.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-500 rounded flex items-center justify-center text-white font-bold">∫</div>
            <div>
              <p className="text-xs text-gray-600">Senaryo 2 Toplam Maliyet (Alan)</p>
              <p className="text-lg font-bold text-purple-700">{senaryo2Toplam.toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detaylı Açıklamalar */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Senaryo Detayları</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-bold text-gray-800 mb-2">Senaryo 1: 2026 Ocak'ta Al</h4>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• Yapracık evi sat: +{vars.yapracikDeger2026.toLocaleString('tr-TR')} ₺</li>
              <li>• Ekstra sermaye: +{vars.ekstraPara.toLocaleString('tr-TR')} ₺</li>
              <li>• 100.Yıl evi al: -{vars.yuzYilDeger2026.toLocaleString('tr-TR')} ₺</li>
              <li>• Kredi: {senaryo1_krediTutar.toLocaleString('tr-TR')} ₺ (%2.7 faiz, {vade} ay)</li>
              <li>• Aylık taksit: {Math.round(senaryo1_aylikTaksit).toLocaleString('tr-TR')} ₺</li>
              <li>• 23.000 ₺ kira ödemesi derhal biter</li>
              <li>• 11.000 ₺ kira geliri biter</li>
              <li>• Net aylık kazanç vs kira: {(23000 - Math.round(senaryo1_aylikTaksit)).toLocaleString('tr-TR')} ₺</li>
              <li>• <strong>{vadeYil} yıl toplam: {senaryo1Toplam.toLocaleString('tr-TR')} ₺</strong></li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-bold text-gray-800 mb-2">Senaryo 2: 2027 Ocak'ta Al</h4>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• 2026: Kirada kal (23.000 ₺/ay) - Toplam 276.000 ₺</li>
              <li>• 2026: Yapracık kirası al (11.000 ₺/ay) - Toplam 132.000 ₺</li>
              <li>• 2026: Net kira gideri: 144.000 ₺</li>
              <li>• {vars.ekstraPara.toLocaleString('tr-TR')} ₺ değerlendir (%45 faiz → {Math.round(ekstraParaBuyumus).toLocaleString('tr-TR')} ₺)</li>
              <li>• 2027: Yapracık sat ({vars.yapracikDeger2027.toLocaleString('tr-TR')} ₺, +%{yapracikArtisYuzdesi} artmış)</li>
              <li>• 2027: 100.Yıl al ({Math.round(vars.yuzYilDeger2027).toLocaleString('tr-TR')} ₺, +%30 artmış)</li>
              <li>• Toplam peşinat: {(Math.round(vars.yapracikDeger2027 + ekstraParaBuyumus)).toLocaleString('tr-TR')} ₺</li>
              <li>• Kredi: {Math.round(senaryo2_krediTutar).toLocaleString('tr-TR')} ₺ (%{faiz2027} faiz, {vade} ay)</li>
              <li>• Aylık taksit: {Math.round(senaryo2_aylikTaksit).toLocaleString('tr-TR')} ₺</li>
              <li>• <strong>{vadeYil} yıl toplam: {senaryo2Toplam.toLocaleString('tr-TR')} ₺</strong></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-2">Varsayımlar:</h4>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>• 100.Yıl emlak fiyat artışı: %30 (2026→2027)</li>
            <li>• Yapracık emlak fiyat artışı: %{yapracikArtisYuzdesi} (2026→2027)</li>
            <li>• Fırsat maliyeti: Yıllık %45 getiri</li>
            <li>• Kira artışları: 23.000 → 30.000 ₺ (2027)</li>
            <li>• Yapracık kirası sabit: 11.000 ₺</li>
            <li>• Tüm rakamlar nominal değerlerdir</li>
            <li>• Vergi, masraf ve emlak komisyonları dahil değildir</li>
          </ul>
        </div>
      </div>

      {/* Karar Kartı */}
      <div className={`rounded-xl shadow-lg p-6 mb-6 ${senaryo1Toplam < senaryo2Toplam ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500' : 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-500'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{senaryo1Toplam < senaryo2Toplam ? '📈' : '📊'}</span>
          <h3 className="text-2xl font-bold text-gray-800">Öneri</h3>
        </div>
        <p className="text-lg text-gray-700 mb-4">
          <strong className={senaryo1Toplam < senaryo2Toplam ? 'text-green-700' : 'text-purple-700'}>
            {senaryo1Toplam < senaryo2Toplam ? 'Senaryo 1: 2026 OCAK\'TA ALIN' : 'Senaryo 2: 2027 OCAK\'TA ALIN'}
          </strong>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-gray-600 text-sm mb-1">Fark</p>
            <p className="text-2xl font-bold text-gray-800">
              {Math.abs(senaryo1Toplam - senaryo2Toplam).toLocaleString('tr-TR')} ₺
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-gray-600 text-sm mb-1">Avantaj</p>
            <p className="text-lg font-semibold text-gray-800">
              %{(Math.abs(senaryo1Toplam - senaryo2Toplam) / Math.max(senaryo1Toplam, senaryo2Toplam) * 100).toFixed(1)} Tasarruf
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-gray-600 text-sm mb-1">Net Bugünkü Değer Farkı</p>
            <p className="text-lg font-semibold text-gray-800">
              {Math.abs(senaryo1NBD - senaryo2NBD).toLocaleString('tr-TR', {maximumFractionDigits: 0})} ₺
            </p>
          </div>
        </div>
      </div>

      {/* Kullanıcı Input Formu */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          Kendi Rakamlarınızla Deneyin
        </h3>
        <p className="text-gray-600 mb-6 text-sm">
          Aşağıdaki parametreleri değiştirerek kendi senaryonuzu oluşturun. Değerler anlık olarak güncellenecektir.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 100.Yıl Değer Artış Oranı */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              100.Yıl Ev Değer Artış Oranı (2026→2027)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={yuzYilArtisOrani}
                onChange={(e) => setYuzYilArtisOrani(Number(e.target.value))}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={yuzYilArtisOrani}
                onChange={(e) => setYuzYilArtisOrani(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">%</span>
            </div>
            <p className="text-xs text-gray-500">
              2027'de 100.Yıl evi: {vars.yuzYilDeger2027.toLocaleString('tr-TR')} ₺
            </p>
          </div>

          {/* Yapracık Değer Artış Oranı */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Yapracık Ev Değer Artış Oranı (2026→2027)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={yapracikArtisOrani}
                onChange={(e) => setYapracikArtisOrani(Number(e.target.value))}
                className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={yapracikArtisOrani}
                onChange={(e) => setYapracikArtisOrani(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">%</span>
            </div>
            <p className="text-xs text-gray-500">
              2027'de Yapracık evi: {vars.yapracikDeger2027.toLocaleString('tr-TR')} ₺
            </p>
          </div>

          {/* Yapracık Kira 2027 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Yapracık Kira Geliri (2027)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={yapracikKira2027}
                onChange={(e) => setYapracikKira2027(Number(e.target.value))}
                step="1000"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              />
              <span className="text-gray-600 font-semibold">₺/ay</span>
            </div>
          </div>

          {/* Faiz 2027 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Kredi Faizi (2027)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={faiz2027}
                onChange={(e) => setFaiz2027(Number(e.target.value))}
                className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={faiz2027}
                onChange={(e) => setFaiz2027(Number(e.target.value))}
                step="0.1"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">%</span>
            </div>
          </div>

          {/* Vade */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Kredi Vadesi
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="12"
                max="120"
                step="12"
                value={vade}
                onChange={(e) => setVade(Number(e.target.value))}
                className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={vade}
                onChange={(e) => setVade(Number(e.target.value))}
                step="12"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">ay</span>
            </div>
            <p className="text-xs text-gray-500">
              {(vade / 12).toFixed(1)} yıl
            </p>
          </div>

          {/* Ekstra Para */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Ekstra Sermaye
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={ekstraPara}
                onChange={(e) => setEkstraPara(Number(e.target.value))}
                step="50000"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              />
              <span className="text-gray-600 font-semibold">₺</span>
            </div>
          </div>

          {/* Fırsat Maliyeti */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Fırsat Maliyeti (Yıllık Getiri)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={firsatMaliyet}
                onChange={(e) => setFirsatMaliyet(Number(e.target.value))}
                className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={firsatMaliyet}
                onChange={(e) => setFirsatMaliyet(Number(e.target.value))}
                step="5"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">%</span>
            </div>
            <p className="text-xs text-gray-500">
              1 yıl sonra: {(ekstraPara * (1 + firsatMaliyet/100)).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>💡 İpucu:</strong> Parametreleri değiştirerek farklı piyasa koşullarını test edebilir, 
            hangi senaryonun sizin için daha uygun olduğunu görebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EvYatirimAnalizi />);