const { useState } = React;

const EvYatirimAnalizi = () => {
  // Kullanıcı değiştirilebilir parametreler
  const [yuzYilArtisOrani, setYuzYilArtisOrani] = useState(30);
  const [yapracikArtisOrani, setYapracikArtisOrani] = useState(20);
  const [yapracikKira2027, setYapracikKira2027] = useState(11000);
  const [faiz2027, setFaiz2027] = useState(1.5);
  const [vade, setVade] = useState(60);
  const [ekstraPara, setEkstraPara] = useState(600000);
  const [firsatMaliyet, setFirsatMaliyet] = useState(45);
  const [senaryo2Yil, setSenaryo2Yil] = useState(2027);
  const [umutKirasi, setUmutKirasi] = useState(23000);

  // Sabit parametreler
  const vars = {
    yapracikDeger2026: 2700000,
    yapracikDeger2027: 2700000 * (1 + yapracikArtisOrani / 100),
    yapracikKira: 11000,
    yuzYilDeger2026: 4300000,
    yuzYilDeger2027: 4300000 * (1 + yuzYilArtisOrani / 100),
    suankiKira: umutKirasi,
    kira2027: umutKirasi,
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
  
  // Senaryo 2: Seçilen yılda al
  const yilFarki = senaryo2Yil - 2026; // 2027 için 1, 2028 için 2, vb.
  const ekstraParaBuyumus = vars.ekstraPara * Math.pow(1 + vars.firsatMaliyet / 100, yilFarki);
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
  const senaryo2BaslangicAy = yilFarki * 12; // Kaç ay sonra alınacak
  
  for (let ay = 0; ay <= vade; ay++) {
    let aylikMaliyet = 0;
    
    if (ay < senaryo2BaslangicAy) {
      // 2026'dan senaryo2Yil'a kadar: Kira öde + Kira al + Fırsat maliyeti kaybı
      const netKira = vars.suankiKira - vars.yapracikKira2027;
      const firsatKaybi = (vars.ekstraPara * (vars.firsatMaliyet / 100)) / 12;
      aylikMaliyet = netKira + firsatKaybi;
    } else if (ay === senaryo2BaslangicAy) {
      // Seçilen yıl Ocak: Satış ve alım
      aylikMaliyet = vars.yuzYilDeger2027 - vars.yapracikDeger2027 - ekstraParaBuyumus;
    } else {
      // Seçilen yıl sonrası: Sadece taksit
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

  // Toplam maliyet hesapları
  const senaryo1Toplam = 
    (senaryo1_aylikTaksit * vade) + 
    ((vars.yapracikKira2027 - vars.suankiKira) * yilFarki * 12);
  
  const senaryo2Toplam = 
    ((vars.suankiKira - vars.yapracikKira2027) * yilFarki * 12) + 
    (senaryo2_aylikTaksit * vade);

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

  // Vade yılı hesapla
  const vadeYil = vade / 12;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          Ah Bi Evim Olsa 🏠🤓
        </h1>
        <p className="text-gray-600">Bu hesap makinesi, yapracıktaki evin satışının şimdi (Senaryo 1) veya daha ileri bir yılda yapılmasının (Senaryo 2) toplam maliyet üzerinden karşılaştırılması için yapılmıştır.</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-yellow-100 to-amber-200 rounded-xl shadow-lg p-6 text-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Senaryo 1: 2026 Ocak'ta Al</h3>
            <span className="text-3xl opacity-80">📅</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">100.Yıl Ev Fiyatı</p>
              <p className="text-2xl font-bold">{vars.yuzYilDeger2026.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Yapracık Satış</p>
              <p className="text-xl font-bold">{vars.yapracikDeger2026.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Peşinat olabilecek ekstra sermaye</p>
              <p className="text-xl font-bold">{vars.ekstraPara.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Kredi Tutarı</p>
              <p className="text-xl font-bold">{senaryo1_krediTutar.toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Aylık Taksit ({vade} ay, %2.7)</p>
              <p className="text-xl font-bold">{Math.round(senaryo1_aylikTaksit).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="border-t border-amber-400 pt-3 mt-3">
              <p className="text-gray-600 text-sm">{vadeYil.toFixed(0)} Yıllık Toplam Maliyet</p>
              <p className="text-2xl font-bold">{Math.round(senaryo1Toplam).toLocaleString('tr-TR')} ₺</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-100 to-purple-200 rounded-xl shadow-lg p-6 text-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Senaryo 2: {senaryo2Yil} Ocak'ta Al</h3>
            <span className="text-3xl opacity-80">📅</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">100.Yıl Ev Fiyatı (+%30)</p>
              <p className="text-2xl font-bold">{Math.round(vars.yuzYilDeger2027).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Yapracık Satış (+%{yapracikArtisYuzdesi})</p>
              <p className="text-xl font-bold">{Math.round(vars.yapracikDeger2027).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Peşinat olabilecek ekstra sermaye (Büyümüş)</p>
              <p className="text-lg font-bold">{Math.round(ekstraParaBuyumus).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Kredi Tutarı</p>
              <p className="text-xl font-bold">{Math.round(senaryo2_krediTutar).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Aylık Taksit ({vade} ay, %{faiz2027})</p>
              <p className="text-xl font-bold">{Math.round(senaryo2_aylikTaksit).toLocaleString('tr-TR')} ₺</p>
            </div>
            <div className="border-t border-purple-400 pt-3 mt-3">
              <p className="text-gray-600 text-sm">{vadeYil.toFixed(0)} Yıllık Toplam Maliyet</p>
              <p className="text-2xl font-bold">{Math.round(senaryo2Toplam).toLocaleString('tr-TR')} ₺</p>
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
              <li>• Taksit toplamı: {Math.round(senaryo1_aylikTaksit * vade).toLocaleString('tr-TR')} ₺</li>
              <li>• Kira tasarrufu ({yilFarki} yıl): {((vars.yapracikKira2027 - vars.suankiKira) * yilFarki * 12).toLocaleString('tr-TR')} ₺</li>
              <li>• <strong>Toplam maliyet: {Math.round(senaryo1Toplam).toLocaleString('tr-TR')} ₺</strong></li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-bold text-gray-800 mb-2">Senaryo 2: {senaryo2Yil} Ocak'ta Al</h4>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• 2026-{senaryo2Yil - 1}: Kirada kal ({umutKirasi.toLocaleString('tr-TR')} ₺/ay) - Toplam {(umutKirasi * (senaryo2Yil - 2026) * 12).toLocaleString('tr-TR')} ₺</li>
              <li>• 2026-{senaryo2Yil - 1}: Yapracık kirası al ({yapracikKira2027.toLocaleString('tr-TR')} ₺/ay) - Toplam {(yapracikKira2027 * (senaryo2Yil - 2026) * 12).toLocaleString('tr-TR')} ₺</li>
              <li>• Net kira gideri: {((umutKirasi - yapracikKira2027) * (senaryo2Yil - 2026) * 12).toLocaleString('tr-TR')} ₺</li>
              <li>• {vars.ekstraPara.toLocaleString('tr-TR')} ₺ değerlendir (%{firsatMaliyet} faiz → {Math.round(ekstraParaBuyumus).toLocaleString('tr-TR')} ₺)</li>
              <li>• {senaryo2Yil}: Yapracık sat ({vars.yapracikDeger2027.toLocaleString('tr-TR')} ₺, +%{yapracikArtisYuzdesi} artmış)</li>
              <li>• {senaryo2Yil}: 100.Yıl al ({Math.round(vars.yuzYilDeger2027).toLocaleString('tr-TR')} ₺, +%{yuzYilArtisOrani} artmış)</li>
              <li>• Toplam peşinat: {(Math.round(vars.yapracikDeger2027 + ekstraParaBuyumus)).toLocaleString('tr-TR')} ₺</li>
              <li>• Kredi: {Math.round(senaryo2_krediTutar).toLocaleString('tr-TR')} ₺ (%{faiz2027} faiz, {vade} ay)</li>
              <li>• Aylık taksit: {Math.round(senaryo2_aylikTaksit).toLocaleString('tr-TR')} ₺</li>
              <li>• Taksit toplamı: {Math.round(senaryo2_aylikTaksit * vade).toLocaleString('tr-TR')} ₺</li>
              <li>• Kira gideri ({yilFarki} yıl): {((vars.suankiKira - vars.yapracikKira2027) * yilFarki * 12).toLocaleString('tr-TR')} ₺</li>
              <li>• <strong>Toplam maliyet: {Math.round(senaryo2Toplam).toLocaleString('tr-TR')} ₺</strong></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-2">Varsayımlar:</h4>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>• 100.Yıl emlak fiyat artışı: %{yuzYilArtisOrani} (2026→{senaryo2Yil})</li>
            <li>• Yapracık emlak fiyat artışı: %{yapracikArtisYuzdesi} (2026→{senaryo2Yil})</li>
            <li>• Fırsat maliyeti: Yıllık %{firsatMaliyet} getiri</li>
            <li>• Umut'un ortalama kirası: {umutKirasi.toLocaleString('tr-TR')} ₺/ay (2026-{senaryo2Yil})</li>
            <li>• Yapracık ortalama kira geliri: {yapracikKira2027.toLocaleString('tr-TR')} ₺/ay (2026-{senaryo2Yil})</li>
            <li>• Peşinat olacak ekstra sermayenin (herhangi bir yıldaki fiyatlaması ile) tamamı, yine bu evin satın alımı için kullanılacaktır</li>
            <li>• Vergi, masraf ve emlak komisyonları dahil değildir</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <h4 className="font-bold text-gray-800 mb-2">Toplam Maliyet Hesaplama Mantığı:</h4>
          <div className="text-gray-700 space-y-2 text-sm">
            <p><strong>Senaryo 1 (2026'da al):</strong></p>
            <p className="ml-4">Toplam Maliyet = (Aylık Taksit × Vade) + Kira Tasarrufu</p>
            <p className="ml-4 text-xs">Kira Tasarrufu = (Yapracık Kirası - Umut Kirası) × {yilFarki} yıl × 12 ay</p>
            <p className="ml-4 text-xs italic">= ({yapracikKira2027.toLocaleString('tr-TR')} - {umutKirasi.toLocaleString('tr-TR')}) × {yilFarki * 12} ay = {((vars.yapracikKira2027 - vars.suankiKira) * yilFarki * 12).toLocaleString('tr-TR')} ₺</p>
            <p className="ml-4 text-xs text-gray-600">(Negatif değer = tasarruf ediyor, kira ödemiyorsunuz)</p>
            
            <p className="mt-3"><strong>Senaryo 2 ({senaryo2Yil}'de al):</strong></p>
            <p className="ml-4">Toplam Maliyet = Kira Gideri + (Aylık Taksit × Vade)</p>
            <p className="ml-4 text-xs">Kira Gideri = (Umut Kirası - Yapracık Kirası) × {yilFarki} yıl × 12 ay</p>
            <p className="ml-4 text-xs italic">= ({umutKirasi.toLocaleString('tr-TR')} - {yapracikKira2027.toLocaleString('tr-TR')}) × {yilFarki * 12} ay = {((vars.suankiKira - vars.yapracikKira2027) * yilFarki * 12).toLocaleString('tr-TR')} ₺</p>
            
            <p className="mt-3 text-xs text-gray-600"><strong>Not:</strong> Ekstra sermaye sadece kredi tutarını belirlemek için kullanılır, toplam maliyete direkt dahil değildir.</p>
          </div>
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
            {senaryo1Toplam < senaryo2Toplam ? 'Senaryo 1: 2026 OCAK\'TA ALIN' : `Senaryo 2: ${senaryo2Yil} OCAK'TA ALIN`}
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
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          Kendi Rakamlarınızla Deneyin
        </h3>
        
        {/* Senaryo 2 Yılı - Öne Çıkarılmış */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300">
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-800">
              📅 Senaryo 2: Hangi Yıl Alınsın?
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2027"
                max="2030"
                step="1"
                value={senaryo2Yil}
                onChange={(e) => setSenaryo2Yil(Number(e.target.value))}
                className="flex-1 h-3 bg-purple-300 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={senaryo2Yil}
                onChange={(e) => setSenaryo2Yil(Number(e.target.value))}
                min="2027"
                max="2030"
                className="w-28 px-4 py-3 border-2 border-purple-400 rounded-lg text-center font-bold text-xl"
              />
              <span className="text-gray-700 font-bold text-lg">Yıl</span>
            </div>
            <p className="text-sm text-purple-700 font-medium">
              Yapracık evi {senaryo2Yil} Ocak'ta satılacak ({yilFarki} yıl sonra)
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 100.Yıl Değer Artış Oranı */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              100.Yıl Ev Değer Artış Oranı Beklentisi (2026→{senaryo2Yil})
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
              {senaryo2Yil}'de 100.Yıl evi: {vars.yuzYilDeger2027.toLocaleString('tr-TR')} ₺
            </p>
          </div>

          {/* Yapracık Değer Artış Oranı */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Yapracık Ev Değer Artış Oranı Beklentisi (2026→{senaryo2Yil})
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
              {senaryo2Yil}'de Yapracık evi: {vars.yapracikDeger2027.toLocaleString('tr-TR')} ₺
            </p>
          </div>

          {/* Umut'un Kirası */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Umut'un 2026-{senaryo2Yil} arası ortalama aylık kira gideri beklentisi
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={umutKirasi}
                onChange={(e) => setUmutKirasi(Number(e.target.value))}
                className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={umutKirasi}
                onChange={(e) => setUmutKirasi(Number(e.target.value))}
                step="1000"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">₺/ay</span>
            </div>
          </div>

          {/* Yapracık Kira Geliri */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Yapracık'tan 2026-{senaryo2Yil} arası ortalama aylık kira geliri beklentisi
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30000"
                step="1000"
                value={yapracikKira2027}
                onChange={(e) => setYapracikKira2027(Number(e.target.value))}
                className="flex-1 h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={yapracikKira2027}
                onChange={(e) => setYapracikKira2027(Number(e.target.value))}
                step="1000"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">₺/ay</span>
            </div>
          </div>

          {/* Faiz 2027 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {senaryo2Yil} yılına ait konut kredisi faiz beklentisi (%)
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
              Peşinat olabilecek ekstra sermaye (Anlık Değer)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="3000000"
                step="10000"
                value={ekstraPara}
                onChange={(e) => setEkstraPara(Number(e.target.value))}
                className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                value={ekstraPara}
                onChange={(e) => setEkstraPara(Number(e.target.value))}
                step="10000"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
              />
              <span className="text-gray-600 font-semibold">₺</span>
            </div>
          </div>

          {/* Fırsat Maliyeti */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Peşinatın fırsat maliyeti (Yıllık Getiri %)
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
              {yilFarki} yıl sonra: {Math.round(ekstraParaBuyumus).toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>💡 İpucu:</strong> Yukarıdaki parametreleri değiştirerek kendi senaryonuzu oluşturun. Değerler anlık olarak güncellenecektir.
          </p>
        </div>
      </div>
    </div>
  );
};



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EvYatirimAnalizi />);