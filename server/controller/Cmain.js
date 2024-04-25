const { Model } = require("sequelize");
const { Tutor, Student } = require("../models");

const bcrypt = require("bcrypt");
const saltRound = 10;

function hashPW(pw) {
    return bcrypt.hashSync(pw, saltRound);
}
function comparePW(inputpw, hashedpw) {
    return bcrypt.compareSync(inputpw, hashedpw);
}

// GET /api
exports.getIndex = (req, res) => {
    res.send("response from api server [GET /api]");
};

// GET /api/signUpTutor
exports.signUpTutor = (req, res) => {
    res.send({ isLogin: false });
};
// GET /api/signUpStudent
exports.signUpStudent = (req, res) => {
    res.send({ isLogin: false });
};
//GET /api/login
exports.login = (req, res) => {
    res.send({ isLogin: false });
};
// GET /api/checkStudentId
// GET /api/checkTutorId
exports.checkId = async (req, res) => {
    const { id } = req.query;
    if (!id) return;

    let isDuplicateTutor, isDuplicateStudent;
    try {
        [isDuplicateTutor, isDuplicateStudent] = await Promise.all([
            Tutor.findOne({ where: { id } }),
            Student.findOne({ where: { id } }),
        ]);
    } catch (error) {
        console.error("checkNickname Error:", error);
        // 오류 처리
        return;
    }

    const available = !isDuplicateTutor && !isDuplicateStudent;
    res.send({ available });
};

// GET /api/checkTutorNickname
// GET /api/checkStudentNickname
exports.checkNickname = async (req, res) => {
    const { nickname } = req.query;
    if (!nickname) return;

    let isDuplicateTutor, isDuplicateStudent;
    try {
        [isDuplicateTutor, isDuplicateStudent] = await Promise.all([
            Tutor.findOne({ where: { nickname } }),
            Student.findOne({ where: { nickname } }),
        ]);
    } catch (error) {
        console.error("checkNickname Error:", error);
        // 오류 처리
        return;
    }

    const available = !isDuplicateTutor && !isDuplicateStudent;
    res.send({ available });
};

// POST /api/tutor
exports.createTutor = async (req, res) => {
    const { id, nickname, password, email, auth } = req.body;
    if (!id || !nickname || !password || !email || !auth) return;
    try {
        await Tutor.create({
            id,
            nickname,
            password: hashPW(password),
            email,
            auth,
        });
        // console.log(result);
        res.send("회원가입 성공");
    } catch (err) {
        console.log("회원가입 실패 err:", err);
        res.status(500).send("회원가입 실패");
    }
};

// POST /api/student
exports.createStudent = async (req, res) => {
    const { id, nickname, password, email } = req.body;

    if (!id || !nickname || !password || !email) return;
    try {
        await Student.create({
            id,
            nickname,
            password: hashPW(password),
            email,
        });

        res.end("회원가입 성공");
    } catch (err) {
        console.log("회원가입 실패", err);
        res.status(500).send("회원가입 실패");
    }
};

// POST /api/loginTutor
exports.loginTutor = async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) return;

    try {
        const resultTutor = await Tutor.findOne({
            where: {
                id,
            },
        });
        // console.log(resultId);
        if (resultTutor) {
            // user가 있을 때
            // 비밀번호 비교
            const loginResult = comparePW(password, resultTutor.password);
            if (loginResult) {
                req.session.tutor = resultTutor.id;
                const tutorId = req.session.tutor;
                console.log(req.session.tutor);
                console.log("dd", req.session.tutor);
                console.log(">>>", req.session);
                console.log("***", req.sessionID);
                res.send({ isLogin: true, tutorId: tutorId });
            } else {
                // 아이디는 있지만 비밀번호 불일치
                res.send("비밀번호가 일치하지 않습니다. 다시 시도해주세요.");
            }
        } else {
            // user 못찾았을 때,
            res.send("존재하지 않는 아이디입니다. 다시 시도해주세요.");
        }
    } catch (err) {
        console.log(err);
    }
};
// POST /api/loginStudent
exports.loginStudent = async (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) return;

    try {
        const resultStudent = await Student.findOne({
            where: {
                id,
            },
        });
        // console.log(resultId);
        if (!resultStudent) return res.send("존재하지 않는 아이디입니다. 다시 시도해주세요.");

        // user가 있을 때
        const loginResult = comparePW(password, resultStudent.password);
        if (!loginResult) {
            //비밀번호 틀렸을 때
            return res.send("비밀번호가 일치하지 않습니다. 다시 시도해주세요.");
        } else {
            req.session.Student = resultStudent.id;
            const studentId = req.session.Student;
            return res.send({ isLogin: true, studentId: studentId });
        }
    } catch (err) {
        console.log(err);
    }
};
exports.logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("세션 삭제 실패:", err);
                return res.status(500).send("서버에러");
            }
            res.clearCookie("sessionID");
            res.redirect("/api");
        });
    } catch (err) {
        console.log(err);
    }
};