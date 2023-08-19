const styles = `
* {
    box-sizing: border-box;
  }
  
  body {
    background: #333;
  }
  
  .tread {
    position: relative;
    padding:10px;
    width:200px;
    height:200px;
    border-radius: 200px;
    background: conic-gradient(from 90deg at 50% 50%
      , #000  0turn, #000  0.03125turn
      , #0000 0.03125turn, #0000 0.0625turn
      , #000  0.0625turn, #000  0.09375turn
      , #0000 0.09375turn, #0000 0.125turn
      , #000  0.125turn, #000  0.15625turn
      , #0000 0.15625turn, #0000 0.1875turn
      , #000  0.1875turn, #000  0.21875turn
      , #0000 0.21875turn, #0000 0.25turn
      , #000  0.25turn, #000  0.28125turn
      , #0000 0.28125turn, #0000 0.3125turn
      , #000  0.3125turn, #000  0.34375turn
      , #0000 0.34375turn, #0000 0.375turn
      , #000  0.375turn, #000  0.40625turn
      , #0000 0.40625turn, #0000 0.4375turn
      , #000  0.4375turn, #000  0.46875turn
      , #0000 0.46875turn, #0000 0.5turn
      , #000  0.5turn, #000  0.53125turn
      , #0000 0.53125turn, #0000 0.5625turn
      , #000  0.5625turn, #000  0.59375turn
      , #0000 0.59375turn, #0000 0.625turn
      , #000  0.625turn, #000  0.65625turn
      , #0000 0.65625turn, #0000 0.6875turn
      , #000  0.6875turn, #000  0.71875turn
      , #0000 0.71875turn, #0000 0.75turn
      , #000  0.75turn, #000  0.78125turn
      , #0000 0.78125turn, #0000 0.8125turn
      , #000  0.8125turn, #000  0.84375turn
      , #0000 0.84375turn, #0000 0.875turn
      , #000  0.875turn, #000  0.90625turn
      , #0000 0.90625turn, #0000 0.9375turn
      , #000  0.9375turn, #000  0.96875turn
      , #0000 0.96875turn, #0000 1turn
    );
  }
  
  .sidewall {
    background: #000;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    padding: 35px;
  }
  
  .inner {
    background: #fff;
    width: 100%;
    height: 100%;
    border-radius: 100%;
  }
  
  .mu {
    color: #0256ff;
    font-size: 110pt;
    font-style: italic;
    font-weight: bold;
    font-family: "Calibri", "Arial", "Helvetica", sans-serif;
    line-height: 0;
    position: relative;
    top: 40px;
    left: 14px;
  }
  
  @keyframes rotating {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .rotating {
    animation: rotating 20s linear infinite;
  }
  .rotating-reverse {
    animation: rotating 20s linear infinite reverse;
  }
  `;

export const mu = <>
    <div className="tread rotating">
        <div className="sidewall rotating-reverse">
            <div className="inner">
            <div className="mu">μ</div>
            </div>
        </div>
    </div>
    <style>
        {styles}
    </style>
</>;