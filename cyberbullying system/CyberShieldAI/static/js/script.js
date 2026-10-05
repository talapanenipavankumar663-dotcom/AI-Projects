$(function(){
  let timer = null;
  $('#post_text').on('input', function(){
    clearTimeout(timer);
    const text = $(this).val();
    timer = setTimeout(()=>{
      if(!text) { $('#realtime_result').addClass('d-none'); return; }
      $.ajax({url:'/api/predict', method:'POST', contentType:'application/json', data:JSON.stringify({text}), success:function(res){
        $('#realtime_result').removeClass('d-none');
        $('#realtime_result').removeClass('safe harmful');
        const cls = (res.prediction=='Safe') ? 'safe' : 'harmful';
        $('#realtime_result').addClass(cls);
        let html = `<strong>${res.prediction}</strong> — Confidence: ${(res.confidence*100).toFixed(1)}%<br>`;
        html += `<em>Sentiment:</em> ${res.sentiment}<br>`;
        if(res.top_words && res.top_words.length){ html += '<div><em>Highlighted words:</em> ' + res.top_words.map(w=>`<span class="highlight">${w}</span>`).join(' ') + '</div>'; }
        $('#realtime_result').html(html);
      }});
    },300);
  });
});
