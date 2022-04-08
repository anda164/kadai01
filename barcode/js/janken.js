
//---------------
//バーコード読み取りメイン処理
//　引用：　https://ameblo.jp/white-rabbit-0925/entry-12579659224.html

$(function () {
    startScanner();
});

const startScanner = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#photo-area'),
            constraints: {
                decodeBarCodeRate: 3,
                successTimeout: 500,
                codeRepetition: true,
                tryVertical: true,
                frameRate: 15,

                //読み込み精度向上のための調整
                //width: 640,
                //height: 480,
                
                width: 800,
                height: 600,
                
                facingMode: "environment"
            },
        },
        decoder: {
            readers:[
                //EAN (JAN)コードを指定
                "ean_reader"
            ]
            /*
            readers: [
                //"i2of5_reader"
                "ean_reader"
            ]
            */
        },

    }, function (err) {
        if (err) {
            console.log(err);
            return
        }

        console.log("Initialization finished. Ready to start");
        Quagga.start();

        // Set flag to is running
        _scannerIsRunning = true;
    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {
                        x: 0,
                        y: 1
                    }, drawingCtx, {
                        color: "green",
                        lineWidth: 2
                    });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "#00F",
                    lineWidth: 2
                });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {
                    x: 'x',
                    y: 'y'
                }, drawingCtx, {
                    color: 'red',
                    lineWidth: 3
                });
            }
        }
    });

    //---------------
    //バーコード読み込み後の処理
    Quagga.onDetected(function (result) {

        gain_code = result.codeResult.code

        //チェックデジットと最初の頭一桁(4で始まる)でコード判定
        if(eanCheckDigit(gain_code)&gain_code.charAt(0)=="4"){
            
            get_jankens(gain_code)

            //window.onload = function(){
            //window.addEventListener('DOMContentLoaded', function() {
                if(!confirm("次を読み込みますか？")){
                    end_application();
                }
            //})

        }

    });
}


//---------------
//読み取ったバーコードのエラー検査
//　引用：　https://qiita.com/mm_sys/items/9e95c48d4684957a3940

function eanCheckDigit(barcodeStr) { // 引数は文字列
    // 短縮用処理
    barcodeStr = ('00000' + barcodeStr).slice(-13);
    let evenNum = 0, oddNum = 0;
    for (var i = 0; i < barcodeStr.length - 1; i++) {
        if (i % 2 == 0) { // 「奇数」かどうか（0から始まるため、iの偶数と奇数が逆）
            oddNum += parseInt(barcodeStr[i]);
        } else {
            evenNum += parseInt(barcodeStr[i]);
        }
    }
    // 結果
    return 10 - parseInt((evenNum * 3 + oddNum).toString().slice(-1)) === parseInt(barcodeStr.slice(-1));
}

//---------------
//終了処理 (bodyを上書き、終了メッセージと初期画面リロードのナビゲーションを表示)
function end_application(){
    const g_point = localStorage.getItem("goo_point");
    const g_point_str = disp_gpoint(g_point);
    const end_html=`<h1>終了しました</h1> <p>${g_point_str}</p><p><a href="./index.html">トップに戻る</a></p>`;
    $("body").html(end_html);
}

//---------------
//Goo Point処理:　ローカルストレージに保存したGoo Pointを加算(ない場合は１を設定) 
function goo_point_add(){
    const key = "goo_point";
    
    if(localStorage.getItem(key)===null){
        g_point=1;
    } else {
        g_point = localStorage.getItem(key);
        g_point++;
    }

    localStorage.setItem(key, g_point);
    disp_gpoint(g_point);

}

//---------------
//ジャンケン処理 (bodyを上書き、終了メッセージと初期画面リロードのナビゲーションを表示)
function get_jankens(gain_code){
    //コードをジャンケンの三手に変換
    // 0: グー(goo)
    // 1: チョキ(chock)
    // 2: パー(par)
    
    hand = Number(gain_code)%3;
    if(hand==0){
        alert("Goo!!")
        /*
        $("#goo").html(
            "<img src='img/goo.png'><br>"
        );*/
        goo_point_add();
        return "goo";
    } else if (hand==1){
        alert("chock");
        return "chock";
    } else if (hand ==2){
        alert("par");
        return "par";
    } else{
        alert("Error!!");
        console.log("Error!!");
    }
}

//---------------
//Goo Pointの表示
function disp_gpoint(g_point){
    const inner_html = `<img src="img/goo.png" width="30px"><span>Goo Point: ${g_point} pts</span>`;
    $("#goo").html(
        inner_html
    );
    return inner_html;
}

//---------------
//Goo Pointのクリア（クリアボタン押下）
$(".gp_clear").on("click", function(){
    
    if(confirm("Gooポイントをリセットします。よろしいですか？")){
        localStorage.removeItem("goo_point");
        disp_gpoint(0);
    }

});

